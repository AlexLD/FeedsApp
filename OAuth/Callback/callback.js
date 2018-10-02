const express = require('express');
const router = express.Router();

router.use('/Twitter',require('./Twitter'));

module.exports = router;