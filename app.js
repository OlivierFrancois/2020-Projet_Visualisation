//--------------- FONCTIONS ---------------//
// Fonction de chargement des données
async function loadData(path) {
    return new Promise( (resolve, reject) => {
        fetch(path)
        .then(response => response.json())
        .then((response) => {
            resolve(response);
        })
    });
}


// Récupéré le maximum de la valeur du champ key parmi l'ensemble des valeur de data
function getMax(data, key) {
    let max = 0;
    
    for (var i=0 ; i < data.length ; i++) {
        // On exclut les régions (identifiable car leur code ne commence pas par D)
        if ((data[i][key] > max) && (data[i].code != "FRA") && data[i].code[0] == 'D') {
            max = data[i][key];
        }
    }
    return max;
}


// Renvoie une couleur entre le vert et le rouge selon la valeur passée en argument
function colorByValue(max, min, val) {
    let intensity
    let r, g;

    // Condition pour éviter log(0)
    if ( ((val - min) == 0) || ((max - min) == 0) ) {
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


//--------------- MAIN ---------------//
window.onload = async function () {
    //------- CONST, VAR, INITIALISATIONS -------//

    // Date
    const changeDate = document.getElementById('change-date');
    changeDate.value = '2020-04-01'
    const btnPrevDay = document.getElementById('previous-day');
    const btnNextDay = document.getElementById('next-day');

    // Données
    const dataKey = 'reanimation'
    const dataPaths = {
        allData: 'https://coronavirusapi-france.now.sh/AllDataByDate?date=' + changeDate.value,
        franceGeojson: 'france2.geojson'
    }
    let globalData = await loadData(dataPaths.allData);
    let max = getMax(globalData.allFranceDataByDate, dataKey);

    // Options du canvas
    let options = {
        width: 700,
        height: 700
    }
    let canvas = d3.select('#container-global-data')
    .append('svg')
    .attr('width', options.width)
    .attr('height', options.height)



    //------- Changement de date -------//
    // Input
    changeDate.addEventListener('change', async () => {
        refreshDate();
    })

    // Boutons
    btnPrevDay.addEventListener('click', () => {
        let date = new Date(changeDate.value);
        date.setDate(date.getDate() - 1);
        changeDate.value = date.toISOString().slice(0,10);

        refreshDate();
    });
    btnNextDay.addEventListener('click', () => {
        let date = new Date(changeDate.value);
        date.setDate(date.getDate() + 1);
        changeDate.value = date.toISOString().slice(0,10);

        refreshDate();
    });

    // Refresh des données en fonction de la date
    async function refreshDate() {
        dataPaths.allData ='https://coronavirusapi-france.now.sh/AllDataByDate?date=' + changeDate.value;
        globalData = await loadData(dataPaths.allData);
        max = getMax(globalData.allFranceDataByDate, dataKey);
        drawMap();
        console.log('refresh');
    }
    

    
    //------- CREATION DE LA MAP -------//
    // Chargement de la map
    let map = await d3.json(dataPaths.franceGeojson);

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
    

    
    //------- DESSIN DE LA MAP -------//
    function drawMap() {
        let areas = group.append('path')
        .attr('d', path)
        // Survole de la souris sur un département
        .on("mouseover", (d) => {
            tooltip.transition()
            .duration(20)
            .style("opacity", .9);      
            tooltip.html(() => {
                // Mise de l'ID du dataGeoJSON au format de l'ID de l'API (DEP-XX)
                let id = 'DEP-' + d.properties.code;
                let covidData = globalData.allFranceDataByDate.find((item) => {
                    return item['code'] === id;
                })

                let dataKeyValue = (covidData && covidData[dataKey]) ? (covidData[dataKey]) : 0
                return "Département : " + d.properties.nom + '<br>Réanimations : ' + dataKeyValue
            })
            .style("left", (d3.event.pageX + 30) + "px")
            .style("top", (d3.event.pageY - 30) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.style("opacity", 0);
            tooltip.html("")
            .style("left", "-500px")
            .style("top", "-500px");
        })
        // Bord et remplissage du département
        .attr('stroke', '#333333')
        .attr('fill', (dataGeoJSON) => {
            if (dataGeoJSON.color) {
                return dataGeoJSON.color
            } else {
                return 'yellow';
            }
        })
        .transition()
        .duration(1000)
        .style('fill', (dataGeoJSON) => {
            // Mise de l'ID du dataGeoJSON au format de l'ID de l'API (DEP-XX)
            let id = 'DEP-' + dataGeoJSON.properties.code;
            let covidData = globalData.allFranceDataByDate.find(item => item['code'] === id)

            if (covidData) {
                let color;
                // Pour éviter les erreurs si le champ n'existe pas dans l'API
                if (!covidData[dataKey]) {
                    color = colorByValue(max, 0, 0)
                    //console.log(color);
                } else {
                    color = colorByValue(max, 0, covidData[dataKey])
                }
                
                dataGeoJSON.color = color;
                return color;
            }
            else
                return '#000000'
        })
        
    }
}