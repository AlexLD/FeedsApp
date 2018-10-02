const express = require('express');
const router = express.Router();

router.use('/Twitter',require('./TwitterLoad'));
router.use('/Facebook',require('./FacebookLoad'));
router.use('/All',require('./SingleLoad'));

module.exports = router;