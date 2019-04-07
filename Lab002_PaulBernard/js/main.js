//First line of main.js - wrap everything in a self excecuting anonymous function to move to local scope
(function(){

// pseudo-global variables
//variables for data join
var attrArray = ["Contraception Use", "Fertility Rate", "GDI", "GDP", "Income Dispairity"];
var expressed = attrArray[0]; //initial attribute    

//chart frame dimensions
var chartWidth = (d3.select(".chartContainer").node().getBoundingClientRect().width) * .9,
    chartHeight = 473,
    leftPadding = 50,
    rightPadding = 2,
    topBottomPadding = 6,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";    

//color scale to be used in multiple functions
var colorClasses = [
     "#EDF8FB",
     "#B2E2E2",
      "#66C2A4",
      "#2CA25F",
     "#006D2C"
];

//legend frame dimensions
var legendHeight = 150,
    legendWidth = 200;
    
//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    
    //map frame dimensions
    var width = (d3.select(".mapContainer").node().getBoundingClientRect().width) * .9,
        height = 700;
    
    //create new svg container for the map
    var map = d3.select(".mapContainer")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);
    
    //create albers equal area conic projection centered on africa
    var projection = d3.geo.albers()
        .center([16.369894, 3.913710])
        .rotate([0, 0, 0])
        .parallels([5, 22])
        .scale(510)
        .translate([width/2, height/2]);
    
    var path = d3.geo.path()
        .projection(projection);
    
    //use queue to parallelize asynchronous data loading
    d3.queue()
        .defer(d3.csv, "data/AfricaData_new.csv") //load attributes from csv
        .defer(d3.json, "data/africa.topojson") //load choropleth spatial data
        .await(callback);
    
    function callback(error, csvData, africa){
        
        //place graticule on the map
        setGraticule(map, path);        
        
        //translate africa TopoJSON
        var africaCountries = topojson.feature(africa, africa.objects.Africa).features;
        
        //join csv data to geojson enumeration units
        africaCountries = joinData(africaCountries, csvData);
        
        //create the color scale
        var colorScale = makeColorScale(csvData);
        
        //add enumeration units to the map
        setEnumerationUnits(africaCountries, map, path, colorScale);
        
        //add coordinated visualization to the map
        setChart(csvData, colorScale);
        
        //create a dropdown menu for attribute selection
        createDropdown(csvData);
        
        //create a choropleth legend
        createLegend(colorClasses);
        
        //create the metadata div
        createMetadata(csvData,expressed);
    };
};
        
function setGraticule(map, path){
    //create graticule generator
    var graticule = d3.geo.graticule()
        .step([10,10]); //place graticule lines every 5 degrees of lat and long
      
      var gratBackground = map.append("path")
          .datum(graticule.outline()) //bind graticule background
          .attr("class","gratBackground") //assign class for styling
          .attr("d",path) //project graticule
        
      //create graticule lines
      var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
          .data(graticule.lines()) //bind graticule lines to each element to be created
          .enter() //create an element for each datum
          .append("path") //append each element to the svg as a path element
          .attr("class","gratLines") //assign class for styling
          .attr("d", path); //project graticule lines
};

function joinData(africaCountries, csvData){
        //loop through csv to assign each set of csv attribute values to geojson region
        for (var i=0; i<csvData.length; i++){
            var csvCountry = csvData[i]; //the current country
            var csvKey = csvCountry.ISO //the csv primary key
            
            //loop through geojson countries to find correct country
            for (var a=0; a<africaCountries.length; a++){
                var geojsonProps = africaCountries[a].properties; //the current country geojson properties
                var geojsonKey = geojsonProps.ISO; //the geojson primary key
                
                //where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey) {
                    
                    //assign all attributes and values
                    attrArray.forEach(function(attr){
                        var val = parseFloat(csvCountry[attr]); //get csv attribute value
                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
                    });
                    
                    //add on the country name to the geojson
                    var countryName = csvCountry.Country;
                    geojsonProps.Country = countryName;
                };
            };
        };
    return africaCountries;
};

function setEnumerationUnits(africaCountries, map, path, colorScale){
    
    //add africa countries to map
    var countries = map.selectAll(".countries")
        .data(africaCountries)
        .enter()
        .append("path")
        .attr("class",function(d){
            return "countries afr" + d.properties.ISO;
        })
        .attr("d", path)
        .style("fill",function(d){
            return choropleth(d.properties, colorScale);
        })
        .on("mouseover", function(d){
            highlight(d.properties);
        })
        .on("mouseout", function(d){
            dehighlight(d.properties)
        })
        .on("mousemove", moveLabel);
    
        var desc = countries.append("desc")
            .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};

//function to create color scale generator
function makeColorScale(data){    
    //create color scale generator
    var colorScale = d3.scale.quantile()
        .range(colorClasses);
    
    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };
    
    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);
    return colorScale;
};
 
//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};

//function to create coordinated bar chart
function setChart(csvData, colorScale){       
    //initial y scale for the chart
    var yScale = d3.scale.linear()
        .range([463,0])
        .domain([0,100]);
    
    //create a second svg element to hold the bar chart
    var chart = d3.select(".chartContainer")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
    
    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    
    //set bars for each country
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a,b){
            return b[expressed] - a[expressed]
        })
        .attr("class", function(d){
            return "bar afr" + d.ISO;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);
    
    //add style description to each rect
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width":"0px"}');
    
    //create vertical axis generator
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");
    
    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);
    
    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    
    //set bar positions, heights, and colors
    updateChart(bars, csvData.length, colorScale, csvData);
};

    
//attribute change listener pseudoo-code
//1.  Change the expressed attribute
//2.  Recreate the color Sclae with new class breaks
//3.  Recolor each enumeration unit on the map
//4.  Re-sort each bar on the bar chart
//5.  Resize each bar on the bar chart
//6.  Recorlor each bar on the bar chart
//function to create a dropdown menu for attribute selection
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select(".mapContainer")
        .append("select")
        .attr("class","dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });
    
    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class","titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");
    
    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};
   
//dropdown change listener handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;
    
    //recreate the color scale
    var colorScale = makeColorScale(csvData);
    
    //recolor enumeration units
    var countries = d3.selectAll(".countries")
        .transition()
        .duration(1000)
        .style("fill",function(d){
            return choropleth(d.properties, colorScale)
        });
    
    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a,b){
            return b[expressed] - a[expressed];
        })
        .transition() //add animation
        .delay(function(d,i){
            return i * 20
        })
        .duration(500);
        
    updateChart(bars, csvData.length, colorScale, csvData);
    updateLegend(colorClasses);
    updateMetadata(csvData,expressed);
};
 
function updateChart(bars, n, colorScale, csvData){
    //find the min and max of the individual data ranges
    var minMaxArray = [];
    for (var i=0; i<n; i++){
        var inputData = csvData[i][expressed];
        minMaxArray.push(parseFloat(inputData));
    };
    
    //change the y scale of the chart depending on the attribute range fed into it, since there are a wide variety of data ranges
    if (expressed == 'Contraception Use') {
        var min = 0;
        var max = 100;
    } else if (expressed == 'Fertility Rate') {
        var min = 0;
        var max = 10;
    } else if (expressed == 'GDI') {
        var min = 0;
        var max = 1.1;
    } else if (expressed == 'GDP') {
        var min = 0;
        var max = 1200000;
    } else if (expressed == 'Income Dispairity') {
        var min = -1000;
        var max = 20000;
    } else {
        var min = 0;
        var max = 100;
    }
    
    var yScale = d3.scale.linear()
        .range([463,0])
        .domain([min,max]);
    
    //create vertical axis generator
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");
    
    //place axis
    var axis = d3.select(".axis")
        .call(yAxis);
    
    //position bars
    bars.attr("x",function(d,i){
        return i * (chartInnerWidth / n) + leftPadding;
    })
    //size/resize bars
    .attr("height", function(d,i){
        return 463 - yScale(parseFloat(d[expressed]));
    })
    .attr("y",function(d,i){
        return yScale(parseFloat(d[expressed])) + topBottomPadding;
    })
    //color/recolor bars
    .style("fill",function(d){
        return choropleth(d, colorScale);
    });
};
  
//fuction to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll(".afr"+props.ISO)
        .style("stroke", "yellow")
        .style("stroke-width", "3");
    
    setLabel(props)
    
};
    
//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll(".afr" + props.ISO)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });
    
    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();
        
        var styleObject = JSON.parse(styleText);
        
        return styleObject[styleName];
    };
    
    d3.select(".infolabel")
        .remove();
};
   
//function to create dynamic label
function setLabel(props,csvData){
    //label the dynamic labe differently based on what the variable expressed is
    if (expressed == 'Contraception Use') {
        var labelString = props[expressed] + "%";
    }  else if (expressed == 'GDP' || expressed == 'Income Dispairity') {
        var labelString = "$" + props[expressed];
    } else {
        var labelString = props[expressed];
    }
    
    //label content
    var labelAttribute = "<b><i>" + props.Country + ": </b>" + labelString + "</i>";
    
    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.ISO + "_label")
        .html(labelAttribute);
    
    var countryName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.COUNTRY);
};
    
//function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;
    
    
    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;
    
    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1;
    
    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

//function to create the choropleth legend
function createLegend(colorClasses){
    //initial array for class break text
    var legendText = ['0% to 8.3%','8.4% to 14.1%','14.2% to 19.4%','19.5% to 44%','44.1% to 100%'];
    
    //add choropleth legend element
    var legend = d3.select(".mapContainer")
        .append("svg")
        .attr("class","legend")
        .attr("height",legendHeight)
        .attr("width",legendWidth);
    
    var legendTitle = legend.append("text")
        .attr("class","legendTitle")
        .text("Legend")
        .attr("transform","translate(5,30)");
    
    //create a rectangle for each color class
    var classBreaks = legend.selectAll(".classBreak")
        .data(colorClasses)
        .enter()
        .append("rect")
        .attr("class", function(d){
            return "classBreak " + d;
        })
        .attr("width",legendWidth/3)
        .attr("height",(legendHeight-50)/colorClasses.length)
        .attr("style",function(d){
            return "fill:" + d
        })
        .attr("y",function(d,i){
            return i * ((legendHeight-50)/colorClasses.length)
        })
        .attr("transform","translate(0,50)");
    
    //add text to the right of each color class
    var classBreaksText = legend.selectAll(".classBreakText")
        .data(legendText)
        .enter()
        .append('text')
        .attr("height",(legendHeight-50)/legendText.length)
        .attr("class", function(d){
            return "classBreakText " + d;
        })
        .attr("x",function(d){
            return (legendWidth/3) + 10;
        })
        .attr("y",function(d,i){
            return i * ((legendHeight-50)/legendText.length)
        })
        .text(function (d){
            return d;
        })
        .attr("transform","translate(0,65)");
}

//function to update the legend with the given expressed attribute
function updateLegend(colorClasses){    
    //array for class break text, varies depending on which variable is represented
    if (expressed == 'Contraception Use') {
        var legendText = ['0% to 8.3%','8.4% to 14.1%','14.2% to 19.4%','19.5% to 44%','44.1% to 100%'];
    } else if (expressed == 'Fertility Rate') {
        var legendText = ['0 to 1.63','1.64 to 2.29','2.3 to 2.8','2.81 to 4.59','4.6 to 6.38'];
    } else if (expressed == 'GDI') {
        var legendText = ['0.224 to 0.831','0.832 to 0.866','0.867 to 0.9','0.901 to .934','0.935 to 1.014'];
    } else if (expressed == 'GDP') {
        var legendText = ['$0 to $10640','$10641 to $25990','$25991 to $36860','$36861 to $130800','$130801 to $1105000'];
    } else if (expressed == 'Income Dispairity') {
        var legendText = ['-$213 to $371','$372 to $702','$703 to $1215','$1216 to $3919','$3920 to $18949'];
    } else {
        var legendText = [1,2,3,4,5];
    }
    
    //add text to the right of each color class
    var classBreaksText = d3.selectAll(".classBreakText")
        .data(legendText)
        .text(function(d){
            return d;
        });
}
    
//function to create the metadata div
function createMetadata(csvData,expressed){
    //add the div
    var metadataDiv = d3.select(".metadataContainer")
        .append("div")
        .attr("class","metadataDiv");
    
    //add the title
    var metadataTitle = metadataDiv.append("h1")
        .attr("class","metadataTitle")
        .text(expressed);
    
    //add the min text
    var minText = metadataDiv.append("p")
        .attr("class","minText")
        .text('min: something small');
    
    //add the max text
    var maxText = metadataDiv.append("p")
        .attr("class","maxText")
        .text('max: something large');
    
    var definedText = metadataDiv.append("h2")
        .attr("class","definedText");
    
    var descText = metadataDiv.append("p")
        .attr("class", "descText")
        .text('insert metadata text here');

    updateMetadata(csvData,expressed);
}
  
//function to update the metadata    
function updateMetadata(csvData,expressed){
    //find the min and max of of the expressed attribute
    var minMaxArray = [];
    for (var i=0; i<csvData.length; i++){
        var inputData = csvData[i][expressed];
        minMaxArray.push(parseFloat(inputData));
    };
    
    //get the min and max amounts
    var min = Math.min.apply(null, minMaxArray),
        max = Math.max.apply(null, minMaxArray);
    
    //create an array of the min country and the max country    
    function findMinMaxCountries(min,max){
        function findMinCountry(input){
            return input == min;
        };
        function findMaxCountry(input){
            return input == max;
        };
        minMaxCountryArray = [csvData[minMaxArray.findIndex(findMinCountry)].Country,csvData[minMaxArray.findIndex(findMaxCountry)].Country];
        return minMaxCountryArray;
    };
    
    var minCountry = findMinMaxCountries(min,max)[0],
        maxCountry = findMinMaxCountries(min,max)[1];
    
    //populate the div elements differently dpending on what the expressed attribute is
    if (expressed == 'Contraception Use') {
        var metadataTitleText = 'Contraception Use',
            minText = minCountry + ' has the lowest contraception use with ' + min + '% use.',
            maxText = maxCountry + ' has the highest contraception use with ' + max + '% use.',
            definedText = 'Contraception Use Defined:',
            descText = 'This is the total amount of the population that uses some sort of contraceptive method.';
    } else if (expressed == 'Fertility Rate') {
        var metadataTitleText = 'Fertility Rate',
            minText = minCountry + ' has the lowest fertility rate with ' + min + '.',
            maxText = maxCountry + ' has the highest fertility rate with ' + max + '.',
            definedText = 'Fertility Rate Defined:',
            descText = 'The number of children who would be born per woman if she were to pass through the childbearing years.';
    } else if (expressed == 'GDI') {
        var metadataTitleText = 'GDI - Gender Development Index',
            minText = minCountry + ' has the lowest Gender Development Index with ' + min + '.',
            maxText = maxCountry + ' has the highest Gender Development Index with ' + max + '.',
            definedText = 'Gender Development Index Defined:',
            descText = 'An index designed to measure gender equality taking into account health, education and command over economic resources.';
    } else if (expressed == 'GDP') {
        var metadataTitleText = 'GDP - Gross Domestic Product',
            minText = minCountry + ' has the lowest GDP with $' + min + '.',
            maxText = maxCountry + ' has the highest GDP with $' + max + '.',
            definedText = 'Gross Domestic Product Defined:',
            descText = 'The total value of goods produced and services provided in a country during one year.';
    } else if (expressed == 'Income Dispairity') {
        var metadataTitleText = 'Income Dispairity',
            minText = minCountry + ' has the lowest income dispairity with $' + min +'.',
            maxText = maxCountry + ' has the highest income dispairity with $' + max + '.',
            definedText = 'Income Dispairity Defined:',
            descText = 'Income dispairity is the average male yearly income minus the average female yearly income.';
    } else {
        var metadataTitleText = 'Title',
            minText = 'min',
            maxText = 'max',
            definedText = 'defined',
            descText = 'description';
    }
    
    //update the title
    var metadataTitle = d3.select(".metadataTitle")
        .text(metadataTitleText);
    
    //update the min text
    var min = d3.select(".minText")
        .text(minText);
    
    //update the max text
    var max = d3.select(".maxText")
        .text(maxText);
    
    //update the defined text
    var definedText = d3.select(".definedText")
        .text(definedText);
    
    //update the description text
    var descText = d3.select(".descText")
        .text(descText);
}
})();