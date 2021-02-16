import React, {Component} from 'react';
import SatSetting from "./SatSetting"
import SatelliteList from "./SatelliteList";
import axios from 'axios';
import {NEARBY_SATELLITE, SAT_API_KEY, STARLINK_CATEGORY} from "../constants";
import WorldMap from "../components/WorldMap"

class Main extends Component {
    constructor(){
        super();
        this.state = {
            satInfo: null,
            setting: null,
            isLoadingList: false,
            satList: null
        };
    }

    render() {
        const {satInfo, isLoadingList, satList, setting} = this.state
        return (
            <div className="main">
                <div className="left-side">
                    <SatSetting onShow={this.showNearbySatellite}/>
                    <SatelliteList isLoad={isLoadingList} satInfo={satInfo} onShowMap={this.showMap}/>
                </div>
                <div className="right-side">
                    <WorldMap satData={satList} observerData={setting}/>
                </div>
            </div>
        );
    }
    showNearbySatellite = (setting) => {
        this.setState({
            setting: setting
        })
        this.fetchSatellite(setting);
    }

    fetchSatellite= (setting) => {
        // fetch data from server
        // get the setting
        const {latitude, longitude, elevation, altitude} = setting;

        // config url
        const url = `/api/${NEARBY_SATELLITE}/${latitude}/${longitude}/${elevation}/${altitude}/${STARLINK_CATEGORY}/&apiKey=${SAT_API_KEY}`;

        // show spin and fetch data
        this.setState({
            isLoadingList: true
        });

        // send request
        axios.get(url)
            .then(response => {
                console.log(response.data)
                // when fetching data succedd, hide spin and update SatInfo
                this.setState({
                    satInfo: response.data,
                    isLoadingList: false
                })
            })
            .catch(error => {
                console.log('err in fetch satellite -> ', error);
                 // when fetching data fails, hide spin
                 this.setState({
                    isLoadingList: false
                })
            })
    }

    showMap = (selected) => {
        this.setState(preState => ({  // ({}) where () can replace "return" keyword
            ...preState,
            satList: [...selected] // ... is shallow copy
        }))
        console.log(selected)
    }

}

export default Main;