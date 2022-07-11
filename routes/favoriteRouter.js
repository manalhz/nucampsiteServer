const express = require('express');
const Favorite = require('../models/favorite');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter
  .route('/')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({ user: req.user._id })
      .populate('User')
      .populate('Campsite')
      .then((favorite) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite);
      })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id }).then((favorite) => {
      if (favorite) {
        // req.body = [{ "_id":"campsite ObjectId" }]
        // Favorite = { "user": "user ObjectId", campsites: [ _id, ... ] }
        req.body.forEach(({ _id }) => {
          if (!favorite.campsites.includes(_id)) {
            favorite.campsites.push(_id);
            favorite.save();
          }
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite);
      } else {
        const campsites = req.body.map(({ _id }) => _id);
        const newFavorite = Favorite.create({ user: req.user._id, campsites });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(newFavorite);
      }
    });
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOneAndDelete({ user: req.user._id })
      .then((favorite) => {
        if (favorite) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(favorite);
        } else {
          res.setHeader('Content-Type', 'text/plain');
          res.send('You do not have any favorites to delete');
        }
      })
      .catch((err) => next(err));
  });

favoriteRouter
  .route('/:campsiteId')
  .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
  .get(cors.cors, (req, res) => {
    res.statusCode = 403;
    res.end('GET operation not supported on /favorites/:campsiteId');
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    console.log(req.params.campsiteId);
    Favorite.findOne({ user: req.user._id }).then((favorite) => {
      if (favorite) {
        if (favorite.campsites.includes(req.params.campsiteId)) {
          res.setHeader('Content-Type', 'text/plain');
          res.send('That campsite is already in the list of favorites!');
        } else {
          favorite.campsites.push(req.params.campsiteId);
          favorite.save();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(favorite);
        }
      } else {
        Favorite.create({
          user: req.user._id,
          campsites: [req.params.campsiteId],
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorite);
      }
    });
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/:campsiteId');
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.findOne({ user: req.user._id })
      .then((favorite) => {
        if (favorite) {
          const index = favorite.campsites.indexOf(req.params.campsiteId);
          if (index !== -1) {
            favorite.campsites.splice(index, 1);
            favorite.save();
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(favorite);
        } else {
          res.setHeader('Content-Type', 'text/plain');
          res.send('You do not have any favorites to delete');
        }
      })
      .catch((err) => next(err));
  });

module.exports = favoriteRouter;
