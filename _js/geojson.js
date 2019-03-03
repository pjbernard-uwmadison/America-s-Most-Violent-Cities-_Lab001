//GOAL: Proportional symbols representing attribute values of mapped features
//STEPS:
//1. Create the Leaflet map--done (in createMap())
//2. Import GeoJSON data--done (in getData())
//3. Add circle markers for point features to the map--done (in AJAX callback)
//4. Determine which attribute to visualize with propertional symbols
//5. For each feature, determine its value for the selected attribute
//6. Give each feature's circle marker a radius based on its attribute value

//Sequence Operator pseudocode
//GOAL: Allow the user to sequence through the attributes and resymbolize the map according to the attribute.
//STEPS:
//1.  Create UI affordances for sequencing
//2.  Listen for user input via affordances
//3.  Respond to user input by changing the selected attribute
//4.  Resize proportional symbols according to each feature's value for the new attribute
//A little more detailed...
//1.  Create slider widget
//2.  Create skip buttons
//3.  Create an array of the sequential attributes to keep track of their order
//4.  Assign the current attribute based on the index of the attributes array
//5.  Listen for user input via affordances
//6.  For a forward step through the sequence, increment the attributes array index
//    for a reverse step, decrement the attributes array index
//7.  At either end of the sequence, return to the opposite end of the sequence on the
//    next step (wrap around)
//8.  Update the slider position based on the new index
//9.  Reassign the current attribute based on the new attributes array index
//10.  Resize proprtional symbols according to each feature's value for the new attribute

//5th Operator pseudocode
//Calculate percentage change given a city when you click on it
//Create a function with the necessary function
//Call the function in the necessary place with the necessary arguments

//Pseudo-code for attribute legend
//1. Add an '<svg>' element to the legend container
//2. Add a '<circle>' element for each of three attribute values: max, mean and min
//3. Assign each '<circle>' element a center and radius based on the dataset max, mean, and min values of the current attribute
//4. Create legend text to label each circle
//5. Update circle attributes and legend text when the data attribute is changed by the user


function calcPercentChange(oldAttribute, newAttribute){
    var percent = (((newAttribute - oldAttribute)/oldAttribute) * 100).toFixed(2);
    return percent + "%";
};

//Toggle Detector for the percent change
var count = 0;
$('#togglePercentChange').click(function() {
    count++;
    console.log(count);
});

//    if (count % 2 === 0) {
//        //don't do anything
//    } else {
//        originalText += textToAppend;
//            };
//    console.log(count);
    
//});

function calcPropRadius(attValue) {
    var scaleFactor = 200000;
    var area = attValue * scaleFactor;
    var radius = Math.sqrt(area/Math.PI);
    return radius;
};

 //function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Determine which attribute to visualize with proportional symbols
    //1.2.3 ex3.11 step 4: Assign the current attribute based on the first index of the attributes
    var attribute = attributes[0];
    //check
    //console.log(attribute);

    //create marker options
    var options = {
        fillColor: "red",
        color: "black",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.4
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string
    var popupContent = "<p><i>"+feature.properties.City+", " + feature.properties.State + "</i></p>"
    //var popupContent = "<p><b>City:</b> " + feature.properties.City + "</p>"
    //popupContent += "<p><b>Violent Crime Rate in " + attribute + ": </b>" + feature.properties[attribute] + "%</p>";

    //create panel content a la popup content
    var panelContent = "<p><b>City:</b> " + feature.properties.City + ", " + feature.properties.State + "</p>";
    
    //add formatted attribute to panel content string
    panelContent += "<p><b>Violent Crime Rate in " + attribute + ":</b> " + (feature.properties[attribute]*100).toFixed(4) + "%</p>";
    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.point(0,-options.radius),
        closeButton: false
    });
    
    //event listners to open popup on hover and fill panel on click
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        },
        click: function(){
            $("#panel").html(panelContent);
        }
    });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};

//Add circle markers for point features to the map
function createPropSymbols(data, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //update the layer style and popup
            //access feature properties
            var props = layer.feature.properties;
            var percentChange = calcPercentChange(props[1985],props[attribute]);
            //console.log(percentChange);
            
            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);
            
            //add popup content string          
            //var popupContent = "<p><i>"+props.City+", " + props.State +"</i></p>";
            //popupContent += "<p><b>" + percentChange + "</b></p>";
            //var togglePopupContent = "<p><b>" + percentChange + "</b></p>";
            if (count % 2 === 0) {
                var popupContent = "<p><i>"+props.City+", "+props.State+"</i></p>";
            } else {
                var popupContent = "<p><i>"+props.City+", "+props.State+"</i></p>"+"<p><b>" + percentChange + "</b></p>";
            };
            console.log(count);
            console.log(popupContent);
                
            //if (count % 2 === 0) {
                //don't do anything
            //} else {
            //    popupContent += togglePopupContent;
            //};
            //popupContent += togglePopupContent;
            //console.log(popupContent);
            
            //add formatted attribute to panel
            var panelContent = "<p><b>City: </b>" + props.City + ", " + props.State +"</p>";
            panelContent += "<p><b>Violent Crime Rate in " + attribute + ": </b>" + (props[attribute]*100).toFixed(4) + "%</p>";
            
            //replace the layer popup
            layer.bindPopup(popupContent, {
                offset: new L.Point(0, -radius)
            });
            
            //replace the layer panel content
            layer.on({
                click: function() {
                    $("#panel").html(panelContent);
                }
            });
        };
    });
};

//1.2.3 Step 1: create new sequence controls
function createSequenceControls(map, attributes, count){
    //create range input element (slider)
    $('#slider').append('<input class="range-slider" type="range">');
    $('#slider').append('<button class="skip" id="reverse">Reverse</button>');
    $('#slider').append('<button class="skip" id="forward">Skip</button>');
    $('#reverse').html('<i class="fa fa-arrow-circle-left" aria-hidden="true"></i>');
    $('#forward').html('<i class="fa fa-arrow-circle-right" aria-hidden="true"></i>');
    
    //1.2.3. ex3.12 adding event lesteners for sequence
    //step 5: click listener for buttons
    $('.skip').click(function(){
        //sequence
        //get the old index value
        var index = $('.range-slider').val();
        
        //Step 6: increment or decrement depending on button clicked
        if ($(this).attr('id') == 'forward'){
            index++;
            //Step 7: if past the last attribute, wrap around to first attribute
            index = index > 29 ? 0 : index;
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            //Step 7: if past the first attribute, wrap around to last attribute
            index = index < 0 ? 29 : index;
        };
        
        //Step 8: update slider
        $('.range-slider').val(index);
        console.log(index);
        //Step 9: pass new attribute to update symbols
        updatePropSymbols(map,attributes[index]);
        updateLegend(map, attributes[index]);
    });
    
    //Listener for percentChangeToggle
    $('#togglePercentChange').click(function() {
        count++;
        var index = $('.range-slider').val();
        updatePropSymbols(map, attributes[index]);
    });
    
    //step 5: input listener for slider
    $('.range-slider').on('input',function(){
        //sequence
        //Step 6: get the new index value
        var index = $(this).val();
        //console.log(index);
        //Step 9: pass new attribute to update symbols
        updatePropSymbols(map, attributes[index]);
        updateLegend(map, attributes[index]);
    });
    
    
    
    //set slider attributes
    $('.range-slider').attr({
        max: 29,
        min: 0,
        value:0,
        step: 1
    });
};

//1.2.3 ex3.9 Step 3: build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];
    
    //properties of the first feature in the dataset
    var properties = data.features[0].properties;
    
    //push each attribute name into attributes array
    for (var attribute in properties){
        if (attribute.includes('19')){
            attributes.push(attribute);
        };
        if (attribute.includes('20')){
            attributes.push(attribute);
        };
    };
    
    console.log(attributes);

    return attributes;
};

function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },
        
        onAdd: function (map) {
            //create the control container with a particular class name
            var container = L.DomUtil.create('div','legend-control-container');
            
            //Put your script to create the temporal legend here
            $(container).append('<div id="temporal-legend">');
            
            //Step 1: start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="160px" height="60px">'
            
            //array of circle names to base loop on
            var circles = {
                max: 20,
                mean: 40,
                min: 60
            };
            
            //loop to add each circle and text to svg string
            for (var circle in circles){
                //circle string
                svg += '<circle class="legend-circle" id="' + circle + '" fill="red" fill-opacity="0.8" stroke="black" cx="30"/>';
                
                //text string
                svg += '<text id="' + circle + '-text" x="65" y="' + circles[circle] + '"></text>';
            };
            //close svg string
            svg += "</svg>";
            
            //add attribute legend svg to container
            $(container).append(svg);
                              
            
            return container;
        }
    });
    
    map.addControl(new LegendControl());
    
    updateLegend(map, attributes[0]);
    
};

//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;
    
    map.eachLayer(function(layer){
        //get the attribute values
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);
            
            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };
            
            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });
    
    //set mean
    var mean = (max + min) / 2;
    
    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};
        

function updateLegend(map, attribute){
    //create content for legend
    var year = attribute;
    //replace temporal legend content
    $('#temporal-legend').html(year);
    
    //get the max, mean, and min values as an object
    var circleValues = getCircleValues(map, attribute);
    
    for (var key in circleValues){
        //get the radius
        var radius = calcPropRadius(circleValues[key]);
        
        //Step 3: assign the cy and r attributes
        $('#'+key).attr({
            cy: (110 - radius)/2,
            r: (radius/2)
        });
        
    //Step 4: add legend text
    $('#'+key+'-text').text(Math.round(circleValues[key]*100)/100).append('%');
    };
};

function getData(map, count){
    $.ajax("_data/citiesCrimeData.geojson", {
        dataType: "json",
        success: function(response){
            //create an attributes array
            var attributes = processData(response);
            createPropSymbols(response, map, attributes);
            createSequenceControls(map, attributes, count);
            createLegend(map, attributes);
        }
    });
};

getData(map);