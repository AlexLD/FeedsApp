const express = require('express');
const router = express.Router();

router.use('/Twitter',require('./Twitter'));
router.use('/Facebook',require('./Facebook'));

module.exports = router;