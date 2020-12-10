async function loadData(path) {
    return new Promise( (resolve, reject) => {
        fetch(path)
        .then(response => response.json())
        .then((response) => {
            resolve(response);
        })
    });
}

function getMax(data) {
    let max = 0;
    //let name;
    for (var i=0 ; i < data.length ; i++) {
        // On exclut les régions et les chiffres globaux
        if ((data[i].deces > max) && (data[i].code != "FRA") && data[i].code[0] == 'D' && data[i].name != 'Paris') {
            max = data[i].deces;
            //name = data[i].code;
        }
    }
    //return name;
    return max;
}

// Obtenir une couleur entre le blanc et le rouge selon la valeur passée en argument
function colorByValue(max, min, val) {
    let intensity
    let r, g;

    // Pour ne pas faire essayer de calculer log(0)
    if ((val - min) == 0) {
        intensity = 0;
    } else {
        intensity = (Math.log(val - min)) / (Math.log(max - min));
    }

    if (intensity > 0.5) {
        r = 255;
        g = Math.round(2 * (1 - intensity) * 255);
    } else {
        g = 255;
        r = Math.round(2 * intensity * 255);
    }

    return "rgb(" + r.toString() + ", " + g.toString() + ", " + 0;
}


window.onload = async function () {
    // Affichage de la date
    let dateContainer = document.getElementById('date-container');
    dateContainer.innerHTML = '2020-04-19'

    const dataPaths = {
        allData: 'https://coronavirusapi-france.now.sh/AllDataByDate?date=2020-04-19',
        franceGeojson: 'france2.geojson'
    }

    let globalData = await loadData(dataPaths.allData);
    let max = getMax(globalData.allFranceDataByDate);
    //console.log(max);


    // Définition du Canvas
    let options = {
        width: 700,
        height: 700,
        border: 'solid black 1px'
    }
    let canvas = d3.select('#container-global-data')
        .append('svg')
        .attr('width', options.width)
        .attr('height', options.height)
        .attr('style', 'border: ' + options.border)
    
    // Chargement de la map geojson
    let map = await d3.json(dataPaths.franceGeojson);
    //console.log(map);
    
    // Définition d'un tooltip
    let tooltip = d3.select("body").append("div")   
        .attr("class", "tooltip")               
        .style("opacity", 0);

    // Association des données de la map à des éléments "g" du DOM
    let group = canvas.selectAll('g')
        .data(map.features)
        .enter()
        .append('g')

    // Mode de projection
    let projection = d3.geoMercator()
        .center([2.454071, 46.279229])
        .scale(2600)
        .translate([options.width / 2, options.height / 2]);
    
    // Application de la projection et dessin
    let path = d3.geoPath().projection(projection);

    drawMap();

    //------- Changement de date -------//
    let changeDate = document.getElementById('change-date');
    changeDate.addEventListener('change', async () => {
        dateContainer.innerHTML = changeDate.value;
        dataPaths.allData ='https://coronavirusapi-france.now.sh/AllDataByDate?date=' +  changeDate.value;

        console.log('refresh1');
        globalData = await loadData(dataPaths.allData);
        max = getMax(globalData.allFranceDataByDate);

        drawMap();
    })
    
    function drawMap() {
    let areas = group.append('path')
        .attr('d', path)
        .attr('class', 'area')
        // Survole de la souris sur un département
        .on("mouseover", (d) => {
            tooltip.transition()
                .duration(20)
                .style("opacity", .9);      
            tooltip.html(() => {
                let id = 'DEP-' + d.properties.code;
                let covidData = globalData.allFranceDataByDate.find((item) => {
                    return item['code'] === id;
                })

                let deces = (covidData && covidData.deces) ? (covidData.deces) : 0
                return "Département : " + d.properties.nom + '<br>Réanimations : ' + deces
            }) 
                .style("left", (d3.event.pageX + 30) + "px")     
                .style("top", (d3.event.pageY - 30) + "px")
        })
        .on("mouseout", function(d) {
            tooltip.style("opacity", 0);
            tooltip.html("")
                .style("left", "-500px")
                .style("top", "-500px");
        })
        // Bord et remplissage du département
        .attr('stroke', '#333333')
        .transition()
        .duration(1000)
        .style('fill', (dataGeoJSON) => {
            // On met l'ID du dataGeoJSON au format de l'ID de l'API (DEP-XX)
            let id = 'DEP-' + dataGeoJSON.properties.code;
            let covidData = globalData.allFranceDataByDate.find((item) => {
                return item['code'] === id
            })

            if (covidData) {
                let color;
                
                // Pour fix l'API qui n'a parfois pas définit de champs deces.
                if (!covidData.deces) {
                    color = colorByValue(max, 0, 0)
                    //console.log(color);
                } else {
                    color = colorByValue(max, 0, covidData.deces)
                }
                
                return color;
            }
            else
                return '#000000'
        })
        
    }
}