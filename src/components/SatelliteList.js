import React, {Component} from 'react';
import { Button ,Spin, List, Avatar, Checkbox} from 'antd';
import satelliteIcon from '../assets/images/satellite.svg'

class SatelliteList extends Component {
    state = {
        //selectedList: [],
        selected: []
    }
    render() {
        const {isLoad} = this.props
        // avoid getting null in the List datasource
        const satList = this.props.satInfo ? this.props.satInfo.above : [];
        const {selected} = this.state

        console.log('selected ', this.state)

        return (
            <div className="sat-list-box">
                <div style={{textAlign: "center"}}>
                    <Button className="sat-list-btn" 
                            size="large" 
                            disabled={selected.length === 0}
                            onClick={this.showMap}
                            >
                        Track on the map
                    </Button>
                </div>
                <hr/>
                { 
                    isLoad ? 
                    <div className="spin-box">
                        <Spin size="large" tip="loading"/>
                    </div>
                    :
                    <List 
                        className="sat-list"
                        itemLayout="horizontal"
                        dataSource={satList}
                        renderItem={item => (  // () to include the renturn obj, without the "return" keyword
                            <List.Item
                                actions={[<Checkbox 
                                            onChange={this.onChange}
                                            dataInfo={item} // tells which satallite you checked
                                        />]}
                            >
                                <List.Item.Meta 
                                    avatar={<Avatar src={satelliteIcon} size={50}/>}
                                    title={<p>{item.satname}</p>}
                                    description={`Launch date: ${item.launchDate}`}
                                />
                            </List.Item>
                        )}
                    />
                }
            </div>
        );
    }

    onChange = e => {
        console.log("clicked")
        const {checked, dataInfo} = e.target;
        // processing the satellite data, add or remove satellite to a list
        const {selected} = this.state;
        // add or remove selected datellite to from the satellite list
        const list = this.addOrRemove(dataInfo, checked, selected);
        this.setState({selected: list})
    }

    addOrRemove = (dataInfo, checked, selected) => {
        // case 1, check is true
        // -> satellite not in the list, add to the list
        // -> satellite in the list, do nothing

        const found = selected.some( item => item.satid === dataInfo.satid) // some is a array method built in for JS, iterate the array to find according to requirement
        if (checked && !found) {
            selected = [...selected, dataInfo]
        }
        // case 2, check is false
        // -> satellite not in the list, do nothing
        // -> satellite in the list, remove

        if (!checked && found) {
            selected = selected.filter(item => item.satid !== dataInfo.satid) // filter, will keep element that meets the requirement
        }
        return selected;
    }

    showMap = () => {
        console.log(this.state)
        const { selected } = this.state;
        this.props.onShowMap(selected);
    }
}

export default SatelliteList;