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
    let options = {
        width: 700,
        height: 700,
        border: 'solid black 1px'
    }
    let width = 700;
    let height = 700;
    let canvas = d3.select('#container-global-data')
        .append('svg')
        .attr('width', options.width)
        .attr('height', options.height)
        .attr('style', 'border: ' + options.border)
    
    // Chargement de la map geojson
    let map = await d3.json('france.geojson');
    console.log(map);

    // Définition d'un tooltip
    let tooltip = d3.select("body").append("div")   
        .attr("class", "tooltip")               
        .style("opacity", 0);

    // Association des données de la map à des éléments "g" du DOM
    let group = canvas.selectAll('g')
        .data(map.features)
        .enter()
        .append('g')
        .on("mouseover", (d) => {
            tooltip.transition()        
                .duration(200)
                .style("opacity", .9);      
            tooltip.html("Département : " + d.properties.nom)  
                .style("left", (d3.event.pageX + 30) + "px")     
                .style("top", (d3.event.pageY - 30) + "px")
        })
        .on("mouseout", function(d) {
            tooltip.style("opacity", 0);
            tooltip.html("")
                .style("left", "-500px")
                .style("top", "-500px");
        });

    // Mode de projection
    let projection = d3.geoMercator()
        .center([2.454071, 46.279229])
        .scale(2600)
        .translate([width / 2, height / 2]);
    
    // Application de la projection et dessin
    let path = d3.geoPath().projection(projection);
    let areas = group.append('path')
        .attr('d', path)
        .attr('class', 'area')
        .attr('fill', 'steelblue')

}