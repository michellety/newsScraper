// dependencies
var cheerio = require("cheerio");
var axios = require("axios");
var express = require("express");
var mongojs = require("mongojs");

// Initialize Express
var app = express();

// Database configuration
var databaseUrl = "scraping";
var collections = ["scrapedData"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
//log any errors if encountered 
db.on("error", function (error) {
    console.log("Database Error:", error);
});

// Main route (simple Hello World Message)
app.get("/", function (req, res) {
    res.send("Hello world");
});

// Retrieve data from the db, send JSON response with all scrapedData
app.get("/all", function (req, res) {
    // Find all results from the scrapedData collection in the db
    db.scrapedData.find({}, function (error, data) {
        // Throw any errors to the console
        if (error) {
            console.log(error);
        }
        // If there are no errors, send the query data to the browser as json
        else {
            res.json(data);
        }
    });
});


// Scrape data from one site and place it into the scrapedData db
app.get("/scrape", function (req, res) {
    // Make a request via axios 
    axios.get("https://www.meetup.com/find/events/").then(function (response) {
        // Load the html body from axios into cheerio
        // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
        var $ = cheerio.load(response.data);
        // For each element with a "title" class
        $(".title").each(function (i, element) {
            // Save the text and href of each link enclosed in the current element
            var title = $(element).children().text().trim();
            var link = $(element).find("a").attr("href");
            var details = $(element).find("span").text();
            
            // If this found element has a title, a link, and details
            if (title && link && details) {
                // Insert the data in the scrapedData db
                db.scrapedData.insert({
                    title: title,
                    link: link,
                    details: details
                },
                    function (err, inserted) {
                        if (err) {
                            // Log the error if one is encountered during the query
                            console.log(err);
                        }
                        else {
                            // Otherwise, log the inserted data
                            console.log(inserted);
                        }
                    });
            }
        });
    });

    // Send a "Scrape Complete" message to the browser
    res.send("Scrape Complete");
});


// Listen on port 3000
app.listen(3000, function () {
    console.log("App running on port 3000!");
});
