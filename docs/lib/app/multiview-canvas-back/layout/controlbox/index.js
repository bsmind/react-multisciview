import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import Slider from 'react-toolbox/lib/slider';
import Button from 'react-toolbox/lib/button';

import theme from './index.css';

class ControlBox extends React.Component {
    renderScatterOptions = () => {
        //const {radius, useOuter, useInner, useGroup, useImage} = this.props;
        const radius = 10, useOuter = true, useInner = true, useGroup = true, useImage = false;

        // if useGroup is false, 
        //      if useInner is true, use zaxis, otherwise sample color
        // if useGroup is true,
        //      if useInner is true, use zaxis, otherwise black with number
        const bOuter = useGroup ? useOuter: false;

        return (
            <div className={this.props.className}>
                <h1 className={theme.title} style={{width: '8%'}}>SCATTER</h1>
                <div style={{width: '15%'}}>
                    <Slider min={1} max={20} value={radius} step={0.5}  
                        onChange={null}/>
                </div>
                <table style={{width: '30%', paddingTop: '0px'}}>
                    <tbody>
                    <tr>
                        <th>
                            <Button icon='group_work' label='GROUP' 
                                accent={useGroup} primary={!useGroup} 
                                onClick={null}
                            />
                        </th>               
                        <th>
                            <Button icon='donut_large' label='OUTER' 
                                accent={bOuter} primary={!bOuter} 
                                onClick={null}
                            />
                        </th>
                        <th>
                            <Button icon='info' label='INNER' 
                                accent={useInner} primary={!useInner} 
                                onClick={null}
                            />
                        </th>
                        <th>
                            <Button icon='photo' label='IMAGE'  
                                accent={useImage} primary={!useImage}
                                onClick={null}
                            />
                        </th>
                        <th>
                            <Button icon='autorenew' label='RESET SHOW IMAGE'  
                                onClick={null}
                            />
                        </th>                                                                                                                 
                    </tr>
                    </tbody>
                </table>
            </div>
        );        
    }

    renderImageOptions = () => {
        //const {fSlop, fIntercept, cmapKind, cmapReverse, useCmap, showGrid} = this.props;
        const fSlop = 1, useCmap = true, cmapReverse = true, showGrid = true;

        return (
            <div className={this.props.className}>
                <h1 className={theme.title} style={{width: '5%'}}>IMAGE</h1>
                <div style={{width: '20%'}}>
                    <Slider min={-10} max={10} step={0.1} value={fSlop} 
                        onChange={null}/>
                </div>
                {/* <div style={{width: '10%'}}>
                    <Slider min={-10} max={10} value={fIntercept} 
                        onChange={value => this.props.setFilterIntercept(value)}/>
                </div>                 */}
                <table style={{width: '30%', paddingTop: '0px'}}>
                    <tbody>
                    <tr>
                        <th>
                            <Button icon='palette' label='TIFF'  
                                accent={useCmap} primary={!useCmap}
                                onClick={null}
                            />
                        </th>
                        <th>
                            <Button icon='invert_colors' label='REVERSE'  
                                accent={cmapReverse} primary={!cmapReverse}
                                onClick={null}
                            />
                        </th>                        
                        <th>
                            <Button icon='grid_on' label='GRID' 
                                accent={showGrid} primary={!showGrid} 
                                onClick={null}
                            />
                        </th> 
                        <th>
                            <Button icon='autorenew' label='RESET SHOW GRID'  
                                onClick={null}
                            />
                        </th>                                                                                                                                          
                    </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    renderProjOptions = () => {
        //const {ratio, useBrush} = this.props;
        const ratio = 5, useBrush = false;
        return (
            <div className={this.props.className}>
                <h1 className={theme.title}>PROJECTION</h1>
                <div style={{width: '20%'}}>
                    <Slider min={0} max={10} value={ratio}
                        onChange={null}/>
                </div>
                <Button icon='zoom_out_map' label='ZOOM/PAN' accent={!useBrush} primary={useBrush} 
                    onClick={null}
                />
            </div>
        );
    }    

    render() {
        const {toolId} = this.props;

        switch (toolId) {
            case 0: return (this.renderScatterOptions());
            case 1: return (this.renderImageOptions());
            case 2: return (this.renderProjOptions());
        }

        return (
            <div className={this.props.className}>
            </div>
        );
    }
}

ControlBox.propTypes = {};
ControlBox.defaultProps = {};

function mapStateToProps(state){
    return {};
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ControlBox);