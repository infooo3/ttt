const express = require('express');
const router = express.Router();

const matchsCtrl = require('../controllers/matchs');
//const auth = require('../middleware/auth');
//const multer = require("../middleware/multer-config")



router.get('/', matchsCtrl.getAllMatchs); //user open webpage: he join a match
router.get('/:matchNumber', matchsCtrl.getMyMatchPositions); //when user click somewhere, if it's his turn, he get his match positions and 
router.post('/:id', matchsCtrl.myMove); // finally, when user click to play, user post new positions in his match positions(for ex: 1X2O3X), turn is over
router.post('/msg/:id', matchsCtrl.message); //to send or receive messages







module.exports = router;

