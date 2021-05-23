'use strict';

const express = require('express')
const pg = require('pg');
const superagent = require('superagent');
const methodOverride = require('method-override');
const cors = require('cors');

require('dotenv').config();
const PORT = process.env.PORT;
const app = express();
const client = new pg.Client(process.env.DATABASE_URL);

app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));
app.use(methodOverride('_method'));
app.use(cors());
app.set('view engine', 'ejs');


app.get('/', homePage);
app.post('/searches', searchJob);
app.post('/addToList', addToDatabase);
app.get('/renderFromDb', renderJobsFromDatabase);
app.get('/details/:id', viewDetails);
app.put('/updateJob/:id', updateJob);
app.delete('/deleteJob/:id', deleteJob);


function deleteJob(req, res) {
    const id = req.params.id;
    const sql = `DELETE FROM work WHERE id=$1`;
    const safeValues = [id];

    client.query(sql, safeValues).then(() => {
        res.redirect('/renderFromDb')
    })
}



function updateJob(req, res) {
    const id = req.params.id;
    const { title, company, location, url, description } = req.body;
    const sql = `UPDATE work SET title=$1, company=$2, location=$3, url=$4, description=$5 WHERE id=$6`
    const safeValues = [title, company, location, url, description, id];

    client.query(sql, safeValues).then(() => {
        res.redirect(`/details/${id}`);
    })
}



function viewDetails(req, res) {
    const id = req.params.id;
    const sql = `SELECT * FROM work WHERE id=$1;`;
    const safeValues = [id];

    client.query(sql, safeValues).then(results => {
        res.render('pages/details', { info: results.rows })
    })
}


function renderJobsFromDatabase(req, res) {
    const sql = `SELECT * FROM work;`;

    client.query(sql).then(results => {
        res.render('pages/myFavorites', { info: results.rows })
    })
}

function addToDatabase(req, res) {
    const { title, company, location, url, description } = req.body;
    const sql = `INSERT INTO work(title, company, location, url, description) VALUES($1, $2, $3, $4, $5)`;
    const safeValues = [title, company, location, url, description];

    client.query(sql, safeValues).then(() => {
        res.redirect('/renderFromDb')
    })
}


function searchJob(req, res) {
    const { description } = req.body;
    const url = `https://jobs.github.com/positions.json?${description}=python&location=usa`;
    superagent.get(url).then(results => {
        res.render('pages/results', { info: results.body })
    })
}





function homePage(req, res) {
    const url = `https://jobs.github.com/positions.json?location=usa`;

    superagent.get(url).then(results => {
        const work = results.body.map(data => {
            return new Job(data);
        })
        res.render('pages/home', { info: work })
    })
}

function Job(info) {
    this.title = info.title;
    this.company = info.company;
    this.location = info.location;
    this.url = info.url;
}





client.connect().then(() => {
    app.listen(PORT, () => {
        console.log(`listining from PORT ${PORT}`);
    })
})