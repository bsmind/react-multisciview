import React from "react";
import {Bar} from "react-chartjs-2";
import get from "lodash.get";
import { hexToRGBA } from "react-multiview/lib/utils";
import { Button } from "react-toolbox/lib/button";
import { Dropdown, Input } from "react-toolbox";

class HistChart extends React.Component {
    constructor() {
        super();
        this.state = {
            numBins: 50,
            isStacked: true,
            selected_attr: "metadata_extract/data/annealing_time"
        };
    }

    getData = () => {
        //const attr = this.state.selected_attr;//"metadata_extract/data/annealing_time";
        //const data = this.props.data;
        //const numBins = this.state.numBins;
        const {selected_attr:attr, data, numBins} = this.props;

        let minVal = null, maxVal = null;
        for (let i = 0; i < data.length; i++)
        {
            if (minVal == null)
            {
                minVal = get(data[i], attr);
                maxVal = minVal;
            }
            else
            {
                const value = get(data[i], attr);
                if (value)
                {
                    if (value < minVal) minVal = value;
                    if (value > maxVal) maxVal = value;
                }
            }
        }

        if (minVal == null || maxVal == null)
        {
            console.log("[ERROR] Hist Chart, null values, ", attr);
            const chartData = {
                labels: [],
                datasets: [
                {
                    label: 'sample',
                    backgroundColor: 'rgba(255,99,132,0.2)',
                    borderColor: 'rgba(255,99,132,1)',
                    borderWidth: 1,
                    hoverBackgroundColor: 'rgba(255,99,132,0.4)',
                    hoverBorderColor: 'rgba(255,99,132,1)',
                    stack: 'Stack 0',
                    data: []
                },
                ]
            };
            return chartData;
        }

        const binWidth = (maxVal - minVal) / numBins;
        const hist = new Array(numBins); 
        for (let i = 0; i < numBins; i++) hist[i] = 0;

        for (let i = 0; i < data.length; i++)
        {
            const value = get(data[i], attr);
            if (value)
            {
                const binIdx = Math.min(Math.floor((value - minVal) / binWidth), numBins-1);
                hist[binIdx]++;
            }
        }

        const labels = new Array(numBins);
        for (let i = 0; i < numBins; i++)
        {
            const left = Number.parseFloat(minVal + i*binWidth).toFixed(2);
            const right = Number.parseFloat(left + binWidth).toFixed(2);
            //if (i < numBins-1) labels[i] = `[${left}, ${right})`
            //labels[i] = `${i}`;
            // if (i === 0) labels[i] = `${left}`;
            // else if (i === numBins - 1) labels[i] = `${right}`;
            // else labels[i] = '';
            labels[i] = '';
        }
 
        const chartData = {
            labels: labels,
            datasets: [
            {
                label: 'ALL',
                backgroundColor: 'rgba(255,99,132,0.2)',
                borderColor: 'rgba(255,99,132,1)',
                borderWidth: 1,
                hoverBackgroundColor: 'rgba(255,99,132,0.4)',
                hoverBorderColor: 'rgba(255,99,132,1)',
                stack: 'Stack 0',
                data: hist
            },
            ]
        };
        return chartData;
    }

    getDataStacked = (samples) => {
        //const attr = this.state.selected_attr;//"metadata_extract/data/annealing_time";
        //const data = this.props.data;
        //const numBins = this.state.numBins;
        const {selected_attr:attr, data, numBins} = this.props;
        let minVal = null, maxVal = null;
        for (let i = 0; i < data.length; i++)
        {
            if (minVal == null)
            {
                minVal = get(data[i], attr);
                maxVal = minVal;
            }
            else
            {
                const value = get(data[i], attr);
                if (value)
                {
                    if (value < minVal) minVal = value;
                    if (value > maxVal) maxVal = value;
                }
            }
        }

        if (minVal == null || maxVal == null)
        {
            console.log("[ERROR] Hist Chart, null values, ", attr);
            const chartData = {
                labels: [],
                datasets: [
                {
                    label: 'sample',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255,99,132,1)',
                    borderWidth: 1,
                    hoverBackgroundColor: 'rgba(255,99,132,0.4)',
                    hoverBorderColor: 'rgba(255,99,132,1)',
                    stack: 'Stack 0',
                    data: []
                },
                ]
            };
            return chartData;
        }

        const binWidth = (maxVal - minVal) / numBins;
        const hist = [];
        for (let i = 0; i < samples.length; i++)
        {
            hist.push(new Array(numBins));
            for (let j = 0; j < numBins; j++) 
                hist[i][j] = 0;
        }
            
        for (let i = 0; i < data.length; i++)
        {
            const value = get(data[i], attr);
            const sample = get(data[i], "sample");
            const idx = samples.indexOf(sample);
            if (value && idx > -1)
            {
                const binIdx = Math.min(Math.floor((value - minVal) / binWidth), numBins-1);
                hist[idx][binIdx]++;
            }
        }

        const labels = new Array(numBins);
        for (let i = 0; i < numBins; i++)
        {
            const left = Number.parseFloat(minVal + i*binWidth).toFixed(2);
            const right = Number.parseFloat(left + binWidth).toFixed(2);
            //if (i < numBins-1) labels[i] = `[${left}, ${right})`
            //labels[i] = `${i}`;
            // if (i === 0) labels[i] = `${left}`;
            // else if (i === numBins - 1) labels[i] = `${right}`;
            // else labels[i] = '';
            labels[i] = '';
        }

        
        const chartData = {
            labels: labels,
            datasets: hist.map( (h, idx) => {
                const rgba = hexToRGBA(this.props.colorAccessor(samples[idx]));

                const backgroundColor = rgba.replace("undefined", "0.5").trim();
                const borderColor = rgba.replace("undefined", "1").trim();
                const hoverBackgroundColor = rgba.replace("undefined", "0.4").trim();
                const hoverBorderColor = rgba.replace("undefined", "1").trim();

                //console.log(backgroundColor, borderColor, hoverBackgroundColor, hoverBorderColor)
                return {
                    label: samples[idx],
                    backgroundColor,
                    borderColor,
                    borderWidth: 1,
                    hoverBackgroundColor,
                    hoverBorderColor,
                    stack: 'Stack 0',
                    data: h
                };
            })
        };
        return chartData;
    }

    handleNumBins = (v) => {
        const num = v.length === 0 ? 1: parseInt(v);
        //this.setState({numBins: Math.max(1, num)});
        if (this.props.onChange)
            this.props.onChange("numBins", num);
    }

    renderOptions = () => {
        //const {isStacked, numBins, selected_attr} = this.state;
        const {isStacked, numBins, selected_attr, onChange} = this.props;
        const sources = this.props.dimKinds.map(dim => {
            return {value: dim, label: dim};
        });
        
        return (
            <div>
                <div style={{display: 'inline-block', width: '14%'}}>
                    <Button label={isStacked ? "stacked": "all"} 
                        onClick={e => onChange("isStacked", !isStacked)} />
                </div>
                <div style={{display: 'inline-block', width: '20%', paddingRight: '15px'}}>
                    <Input
                        type={'number'} 
                        label={'#BINS'}
                        value={numBins}
                        onChange={this.handleNumBins} 
                    />
                </div>
                <div style={{display: 'inline-block', width: '65%'}}>
                    <Dropdown 
                        auto={true}
                        source={sources}
                        value={selected_attr}
                        label='Select an attribute...'
                        onChange={v => onChange("selected_attr", v)}
                        //onChange={v => this.setState({selected_attr: v})}
                    />
                </div>
            </div>
        );
    }

    render() {
        const {isStacked} = this.props;
        return (
            <div>
                {this.renderOptions()}
                <div>
                    <Bar
                        data={isStacked ? this.getDataStacked(this.props.samples): this.getData()}
                        width={100}
                        height={this.props.height - 70}
                        options={{
                            maintainAspectRatio: false,
                            legend: {display: false},
                        }}
                    />            
                </div>
            </div>
        );
    }
}

export default HistChart;