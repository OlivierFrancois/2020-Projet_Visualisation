async function loadData(path) {
    return new Promise( (resolve, reject) => {
        fetch(path)
        .then(response => response.json())
        .then((response) => {
            console.log(response);
            resolve(response);
        })
    });
}

window.onload = async function () {
    /*const path = {
        allData: 'https://api.covid19api.com/summary'
    }

    const globalData = await loadData(path.allData);

    //let data = [globalData.casConfirmes, globalData.deces, globalData.gueris];

    */

    // Définition du Canvas
    let width = 700;
    let height = 700;
    let canvas = d3.select('#container-global-data')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Chargement de la map geojson
    let map = await d3.json('france.geojson');
    console.log(map);

    // Association des données de la map à des éléments "g" du DOM
    let group = canvas.selectAll('g')
        .data(map.features)
        .enter()
        .append('g')

    // Mode de projection
    let projection = d3.geoMercator()
        .scale(2000) 
        .rotate([0, 0]) 
        .center([0, 0]) 
        .translate([width / 2, height * 3]); 
    
    // Application de la projection et dessin
    let path = d3.geoPath().projection(projection);
    let areas = group.append('path')
        .attr('d', path)
        .attr('class', 'area')
        .attr('fill', 'steelblue')
}