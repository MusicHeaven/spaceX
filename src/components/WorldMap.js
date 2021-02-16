import React, {Component} from 'react';
import { WORLD_MAP_URL, SATELLITE_POSITION_URL, SAT_API_KEY } from '../constants'
import axios from 'axios'
import { feature } from "topojson-client"
import { geoKavrayskiy7 } from 'd3-geo-projection';
import {select as d3Select} from 'd3-selection'
import {geoPath, geoGraticule} from "d3-geo"
import { schemeCategory10 } from "d3-scale-chromatic";
import * as d3Scale from "d3-scale";
import { timeFormat as d3TimeFormat } from "d3-time-format";


const width = 960;
const height = 600;

class WorldMap extends Component {
    constructor() {
        super();
        this.refMap = React.createRef();
        this.refTrack = React.createRef();
        this.map = null;
        // d3 scale can match a number range with color pallate. define the start and end, will automatically show color in middle with given number
        this.color = d3Scale.scaleOrdinal(schemeCategory10);
    }
    // use absolute position to overlap two canvas. parent is relative, child is absolute.
    render() {
        return (
            <div className="map-box">
                <canvas ref={this.refMap} className="map"/>
                <canvas ref={this.refTrack} className="track"/> 
            </div>
        );
    }


    componentDidMount() {
        axios.get(WORLD_MAP_URL)
        .then(response => {
            const {data} = response
            const land = feature(data, data.objects.countries).features
            console.log(land)

            this.generateMap(land)
        })
    }

    // get map data, and insert data into map shape and create projection.
    generateMap = (land) => {
        const projection = geoKavrayskiy7()
            .scale(170)
            .translate([width / 2, height / 2])
            .precision(.1);

            // next step, get virtual DOM position of the map and show map on virtual DOM
            // native jsL getElementbyId or classname, in react use Ref. in D3, use "d3-selection"
            // this.refMap.current is the dom element
            // don't recomment use selectElementByClassname, because it's native js, prefer use react code in react

            const canvas = d3Select(this.refMap.current)
                .attr("width", width)
                .attr("height", height)

            const canvas2 = d3Select(this.refTrack.current)
                .attr("width", width)
                .attr("height", height)

            // start draw the image
            // canvas function node decide how may dimension is the drawing
            let context = canvas.node().getContext("2d")
            let context2 = canvas2.node().getContext("2d")

            // drawing, geopath is the pen
            // path will receivde the path data
            let path = geoPath().projection(projection).context(context)
            let graticule = geoGraticule();

            // 
            land.forEach(ele => {
                // define pen attibutes
                context.fillStyle = '#B3DDEF';
                context.strokeStyle = '#000';
                context.globalAlpha = 0.7; // the precision of the map (how clear the boundary and fill is)
                context.beginPath(); // start drawing
                path(ele);
                context.fill();
                context.stroke();

                // draw latitude longitude
                context.strokeStyle = 'rgba(220, 220, 220, 0.1)'; // latitude longitude stroke color
                context.beginPath();
                path(graticule());
                context.lineWidth = 0.1;
                context.stroke();
                
                // draw the top and bottom line of the map 
                context.beginPath();
                context.lineWidth = 0.5;
                path(graticule.outline());
                context.stroke();

                // if import image, and use <img src="">

            })

            this.map = {
                projection: projection,
                graticule: graticule,
                context: context,
                context2: context2
            };
          

    }

    // use aother canvas to stack ontop of map, to mark dot of the satellite. 
    componentDidUpdate(prevProps, prevState, snapshot) {
        // avoid dead cycle, do conditional setstate
        if (prevProps.satData !== this.props.satData) {
            // step 1: get setting and selected satList
            const {
                latitude,
                longitude,
                elevation,
                altitude,
                duration
              } = this.props.observerData;

            // for the trace of the satellite, we acceelarate 60 times
            const endTime = duration * 60

            // step 2: prepare for url
            const {satData} = this.props;
            const urls = satData.map(sat => {
                const {satid} = sat;
                const url = `/api/${SATELLITE_POSITION_URL}/${satid}/${latitude}/${longitude}/${elevation}/${endTime}/&apiKey=${SAT_API_KEY}`;
                return axios.get(url);
            })

            // step 3: set sat position data
            Promise.all(urls)
                .then(result => {
                    console.log(result)
                    const arr = result.map(res => res.data);

                    // step 4: track 
                    this.track(arr);
                })
            
        }
    }

    track = data => {
        if (!data[0].hasOwnProperty("positions")) {
            throw new Error("no position data");
            return;
          }
          
          // step 1: total number of position
          const len = data[0].positions.length;
          
      
          // step 2: duration
          const { duration } = this.props.observerData;
          
          // step 3: where to draw
          const { context2 } = this.map;

          let now = new Date();
          let i = 0; // calculate how mamy data have drawn

          let timer = setInterval(() => {
            let ct = new Date();
            
            // i = 0 is using the now time, which is the first dot, From the second dot, are using the ct time
            let timePassed = i === 0 ? 0 : ct - now;
            let time = new Date(now.getTime() + 60 * timePassed);
            
            // show current satellite time
            context2.clearRect(0, 0, width, height);
      
            context2.font = "bold 14px sans-serif";
            context2.fillStyle = "#333";
            context2.textAlign = "center";
            context2.fillText(d3TimeFormat(time), width / 2, 10);
      
            // last dot 
            if (i >= len) {
              clearInterval(timer);
              this.setState({ isDrawing: false });
            //   const oHint = document.getElementsByClassName("hint")[0];
            //   oHint.innerHTML = "";
              return;
            }
      
            // use position data, data is an array
            data.forEach(sat => {
              const { info, positions } = sat;
              this.drawSat(info, positions[i]);
            });
      
            // to tack the real time 
            i += 60;
          }, 1000);
    }
    drawSat = (sat, pos) => {
        const { satlongitude, satlatitude } = pos;
    
        if (!satlongitude || !satlatitude) return;
    
        const { satname } = sat;
        // real name is name+number, only get the number
        const nameWithNumber = satname.match(/\d+/g).join("");
    
        const { projection, context2 } = this.map;
        const xy = projection([satlongitude, satlatitude]);
    
        // draw dot
        context2.fillStyle = this.color(nameWithNumber);
        context2.beginPath();
        context2.arc(xy[0], xy[1], 4, 0, 2 * Math.PI);
        context2.fill();
    
        // distance of satellite name to the dot
        context2.font = "bold 11px sans-serif";
        context2.textAlign = "center";
        context2.fillText(nameWithNumber, xy[0], xy[1] + 14);
    };
}

export default WorldMap;

