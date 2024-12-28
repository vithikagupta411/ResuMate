const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Set EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware for parsing request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configure multer for file uploads
const upload = multer({ dest: path.join(__dirname, "uploads/") });

// Routes to render views
app.get("/", (req, res) => {
  res.render("index");
});

// Stripe checkout route
app.post('/checkout', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'service1',
            },
            unit_amount: 50 * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3001/complete',
      cancel_url: 'http://localhost:3001/cancel',
    });
    console.log(session);
    res.redirect(session.url);
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    res.status(500).send("Payment processing failed.");
  }
});

// Register page route
app.get("/register", (req, res) => {
  res.render("register");
});

// Signin page route
app.get("/signin", (req, res) => {
  res.render("signin");
});

// About page route
app.get("/about", (req, res) => {
  res.render("about");
});

// Redirect route to about
app.get("/redirect-to-about", (req, res) => {
  res.redirect("/about");
});

// Successful payment page route
app.get("/succesfulpage", (req, res) => {
  res.render("succesfulpage");
});

// Route to render ATS result page
app.get("/result", (req, res) => {
  res.render("ats-result", {
    atsScore: null,
    feedback: null,
    speedometer: null,
    courseSuggestions: null,
  });
});

// Route to handle resume and job description uploads and ATS scoring
app.post("/upload", upload.fields([
  { name: "resumeFile", maxCount: 1 },
  { name: "jobDescriptionFile", maxCount: 1 }
]), (req, res) => {
  const resumeFile = req.files.resumeFile[0];
  const jobDescriptionFile = req.files.jobDescriptionFile[0];

  const resumePath = resumeFile.path;
  const jobDescriptionPath = jobDescriptionFile.path;

  // Execute Python script to analyze the files
  exec(`main.py ${resumePath} ${jobDescriptionPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Execution error: ${error}`);
      return res.status(500).send("Error analyzing ATS score.");
    }

    try {
      const atsData = JSON.parse(stdout);
      res.render("ats-result", {
        atsScore: atsData.score,
        feedback: atsData.feedback,
        speedometer: atsData.speedometer,
        courseSuggestions: atsData.courseSuggestions,
      });
    } catch (parseError) {
      console.error("Error parsing script output:", parseError);
      res.status(500).send("Error processing ATS results.");
    }

    // Clean up temporary files
    fs.unlink(resumePath, () => {});
    fs.unlink(jobDescriptionPath, () => {});
  });
});

// Route for payment success
app.get("/complete", (req, res) => {
  res.render("complete");
});

// Route for payment cancellation
app.get("/cancel", (req, res) => {
  res.render("cancel");
});

// Start the server
app.listen(3001, () => {
  console.log("Server started on port 3001");
});
