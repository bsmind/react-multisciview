import forEach from 'lodash.foreach';
import {SAMPLE_MATERIAL_HINTS} from '../constants';

function makeNode(id, r, group = 0) {
    return {id, r, group, keys: [], top: []};
}

function makeLink(sourceNode, targetNode, level = 0) {
    return {
        source: sourceNode.id,
        target: targetNode.id,
        level
    };
}

function findNodeIndex(nodes, id) {
    return nodes.findIndex(node => node.id === id);
}

function getMaterial(name, separator = '_') {
    let startIndex = -1;

    SAMPLE_MATERIAL_HINTS.forEach(hint => {
        if (startIndex >= 0) return;
        startIndex = name.indexOf(hint);
    });

    if (startIndex === -1) return null;
    
    let endIndex = startIndex;
    while (endIndex < name.length && name[endIndex] !== separator) 
        endIndex++;

    return name.substring(startIndex, endIndex);
}

export function getGraphDataFromSampleNames(sampleNames, separator = '_') {
    const nodes = [], links = [];

    let sourceNode, targetNode, nodeIndex, topNodeIndex;

    forEach(sampleNames, (name, key) => {
        const material = getMaterial(name, separator);
        if (material == null) return;

        // make source (material) node
        nodeIndex = findNodeIndex(nodes, material);
        if (nodeIndex === -1) {
            nodes.push(makeNode(material, 5, 0));
            nodeIndex = nodes.length - 1;
        }
        sourceNode = nodes[nodeIndex];
        sourceNode.keys.push(key);
        //sourceNode.keys.push(name);
        topNodeIndex = nodeIndex;

        const tokens = name.split(separator);
        let level = 0, nTokens = tokens.length;
        tokens.forEach(token => {
            nTokens--;
            if (token === material) {return;}

            token = token.toUpperCase();

            nodeIndex = findNodeIndex(nodes, token);
            if (nodeIndex === -1) {
                nodes.push(makeNode(token, 3, 1));
                nodeIndex = nodes.length - 1;
            }
            targetNode = nodes[nodeIndex];
            
            //targetNode.keys.push(key);
            //targetNode.keys.push(name);
            //targetNode.top.push(topNodeIndex);
            if (nTokens===0 && targetNode.keys.indexOf(key) === -1)
                targetNode.keys.push(key);

            if (targetNode.top.indexOf(topNodeIndex) === -1)
                targetNode.top.push(topNodeIndex);


            links.push(makeLink(sourceNode, targetNode, level));
            level++;

            sourceNode = {...targetNode};
        });
    });

    return {nodes, links};
}