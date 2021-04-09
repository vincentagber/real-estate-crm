const express = require('express');
const session = require('express-session');
const { ObjectID } = require('mongodb');

const { User } = require('../models/User');
const { mongoose } = require('../db/mongoose');
const router = express.Router();

// Our own express middleware to check for
// an active user on the session cookie (indicating a logged in user.)
const sessionChecker = (req, res, next) => {
  if (req.session.user) {
    res.send({ loggedInAs: user.username });
  } else {
    res.sendStatus(401);
  }
};

// middleware for mongo connection error for routes that need it
const mongoChecker = (req, res, next) => {
  // check mongoose connection established.
  if (mongoose.connection.readyState != 1) {
    console.log('Issue with mongoose connection');
    res.sendStatus(500);
    return;
  } else {
    next();
  }
};

const adminAuthenticate = (req, res, next) => {
  if (req.session.MongoId) {
    User.findById(req.session.MongoId)
      .then((user) => {
        if (!user || user.accountType !== 'admin') {
          return Promise.reject();
        } else {
          req.user = user;
          next();
        }
      })
      .catch((err) => {
        res.sendStatus(401);
      });
  } else {
    res.sendStatus(401);
  }
};

// Middleware for authentication of resources
const authenticate = (req, res, next) => {
  if (req.session.user) {
    User.findById(req.session.user)
      .then((user) => {
        if (!user) {
          return Promise.reject();
        } else {
          req.user = user;
          next();
        }
      })
      .catch((err) => {
        res.sendStatus(401);
      });
  } else {
    res.sendStatus(401);
  }
};

function isMongoError(error) {
  // checks for first error returned by promise rejection if Mongo database suddently disconnects
  return (
    typeof error === 'object' &&
    error !== null &&
    error.name === 'MongoNetworkError'
  );
}

router.post('/signup', mongoChecker, async (req, res) => {
  const {
    username,
    password,
    firstName,
    lastName,
    email,
    phone,
    specialization,
    yearStarted,
    bio,
    licenseId,
    brokerage,
    brokerageAddress,
    brokerageNumber,
    accountType,
  } = req.body;
  if (
    !username ||
    !password ||
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !yearStarted ||
    !licenseId ||
    !brokerage ||
    !brokerageAddress ||
    !brokerageNumber ||
    !accountType
  ) {
    res.sendStatus(400);
  } else {
    const user = new User({
      username,
      password,
      firstName,
      lastName,
      email,
      phone,
      specialization,
      yearStarted,
      bio,
      licenseId,
      brokerage,
      brokerageAddress,
      brokerageNumber,
      accountType,
      activated: false,
    });

    try {
      const newUser = await user.save();
      res.send(newUser);
    } catch (err) {
      console.log(err);
      if (isMongoError(err)) {
        res.sendStatus(500);
      } else {
        res.sendStatus(400);
      }
    }
  }
});

router.post('/login', mongoChecker, async (req, res) => {
  const { username, password } = req.body;

  try {
    // Use the static method on the User model to find a user
    // by their email and password.
    const user = await User.findByUsernamePassword(username, password);

    if (user.activated || user.accountType === 'admin') {
      await User.findOneAndUpdate(
        { username },
        { lastLogin: new Date().toISOString() },
        { new: true }
      );
      req.session.username = user.username;
      req.session.MongoId = user._id;
      req.session.name = `${user.firstName} ${user.lastName}`;
      req.session.accountType = user.accountType;
      res.send({
        username: user.username,
        MongoId: user._id,
        loggedInAs: `${user.firstName} ${user.lastName}`,
        accountType: user.accountType,
      });
    } else {
      res.sendStatus(401);
    }
    // res.redirect('/dashboard');
  } catch (err) {
    if (isMongoError(err)) {
      res.sendStatus(500);
    } else {
      res.sendStatus(400);
    }
  }
});

router.get('/logout', mongoChecker, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
});

router.get('/checkSession', (req, res) => {
  if (req.session.username) {
    res.send({
      loggedInAs: req.session.name,
      MongoId: req.session.MongoId,
      username: req.session.username,
      accountType: req.session.accountType,
    });
  } else {
    res.sendStatus(401);
  }
});

router.patch(
  '/request/:agent_id',
  mongoChecker,
  adminAuthenticate,
  async (req, res) => {
    const agent_id = req.params.agent_id;

    if (!ObjectID.isValid(agent_id)) {
      res.sendStatus(404);
      return;
    }

    const fieldsToUpdate = { activated: req.body.value };

    try {
      const agent = await User.findOneAndUpdate(
        { _id: agent_id },
        { $set: fieldsToUpdate },
        { new: true }
      );
      if (!agent) {
        res.sendStatus(404);
      } else {
        res.send(agent);
      }
    } catch (err) {
      if (isMongoError(err)) {
        res.sendStatus(500);
      } else {
        res.sendStatus(404);
      }
    }
  }
);

module.exports = router;
