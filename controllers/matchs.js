const Match = require('../models/match');
const fs = require('fs');
const path = require('path');

const { open } = require('inspector');

function cellControl(cellA, cellB, cellC, positions) {
  return (positions.includes(cellA) && positions.includes(cellB) && positions.includes(cellC))
}




//---------------------------------------------------------------------------------------------------------------------------
exports.getAllMatchs = (req, res) => {
  let openMatch
  let openMatchN = ""
  let matchN
  let userID = Math.random().toString(36).substring(2)
  let matches
  let myMatchNumber

  //If a match "open" exist, we need his number (openMatchN)
  Match.find()
    .exec((error, matchs) => {
      openMatch = (matchs.filter(matchsToFilter => matchsToFilter.matchOpen == true))
      matches = matchs
      if (openMatch != "") {
        console.log("---A match exist yet: you join it")
        openMatchN = openMatch[0].matchNumber;
        //we didn't create the new match, so we are the player O; we join and close openMatch
        myMatchNumber = openMatchN
        let matchObject = { ...openMatch }
        matchObject.userIdO = userID;
        matchObject.matchOpen = false;
        console.log("---match is now closed because 2 players joined it")
        let query = { 'matchNumber': openMatchN };
        Match.findOneAndUpdate(query, matchObject, { upsert: true }, function (err, doc) {
          if (err) return res.status(500).send({ error: err });
          return res.status(200).send({ message: "Sei in partita!", match: openMatchN, id: userID });
        })
      }

      //If there is not a match open, we need to create a new match
      if (openMatch == "") {
        console.log("---there is not a match avaible: let's create a new one!")
        matchN = matches.length + 1
        const createNewMatch = {
          "matchNumber": matchN,
          "matchOpen": true,
          "playingUser": "first",
          "gamePositions": "",
          "userIdX": userID,
          "userIdO": ""
        }
        myMatchNumber = matchN
        const match = new Match(createNewMatch)
        match.save()
        return res.status(201).send({ message: "Hai creato una partita!", match: matchN, id: userID })
      }
    })
}


//---------------------------------------------------------------------------------------------------------------------------


exports.getMyMatchPositions = (req, res, next) => {
  console.log("--------------------------getMyMatchposition")
  reqUserId = req.params.matchNumber.split(",")[1]
  reqMatchNumber = req.params.matchNumber.split(",")[0]

  if (reqMatchNumber.match(/[^0-9 ]/g) != null || reqUserId.match(/[^a-zA-Z0-9 ]/g) != null) {
    console.log("---reqUserId or reqUserMatchNumber are wrong")
    return res.status(403).send({ message: "ID e numero partita necessari" })
  }
  let userXorO
  let positions
  let lostMatch = false
  //getting the user's match informations and verify them. Then, if other play end turn, download gamePositions from db array.
  Match.find()
    .exec((error, matchs) => {
      console.log("---Let's find the matchN")
      let thisMatch = (matchs.filter(matchsToFilter => matchsToFilter.matchNumber == reqMatchNumber))
      if (thisMatch[0] == undefined) {
        console.log("---Corrupted req")
        return res.status(403).send({ message: "Ti servono un ID e un numero partita" })
      }
      if (thisMatch[0].matchOpen == true) {
        console.log("---User is alone")
        return res.status(500).send({ message: "Sei da solo... :(" })
      }
      if (thisMatch[0].userIdO == reqUserId) {
        console.log("---User is O")
        userXorO = "O";
        if (thisMatch[0].playingUser != "second") {
          console.log("---Not user O turn!")
          return res.status(403).send({ message: "L'altro giocatore è lento.." })
        }
        else {
          positions = thisMatch[0].gamePositions
          console.log(positions + "positions")
          //player is X
          if (cellControl("1X", "2X", "3X", positions) || cellControl("4X", "5X", "6X", positions) || cellControl("7X", "8X", "9X", positions) || cellControl("1X", "4X", "7X", positions) || cellControl("2X", "5X", "8X", positions) || cellControl("3X", "6X", "9X", positions) || cellControl("1X", "5X", "9X", positions) || cellControl("3X", "5X", "7X", positions)) {
            console.log("---it's your turn but you (O) lose.")
            lostMatch = true
          }
          return res.status(200).send({ positions: positions, user: userXorO, lostMatch })
        }
      }
      if (thisMatch[0].userIdX == reqUserId) {
        console.log("---User is X")
        userXorO = "X"
        if (userXorO == "X" && thisMatch[0].playingUser != "first") {
          console.log("---Not user X turn!")
          return res.status(404).send({ message: "L'altro giocatore è lento.." })
        }
        else {
          positions = thisMatch[0].gamePositions
          let d = "O"

          if (cellControl("1O", "2O", "3O", positions) || cellControl("4O", "5O", "6O", positions) || cellControl("7O", "8O", "9O", positions) || cellControl("1O", "4O", "7O", positions) || cellControl("2O", "5O", "8O", positions) || cellControl("3O", "6O", "9O", positions) || cellControl("1O", "5O", "9O", positions) || cellControl("3O", "5O", "7O", positions)) {
            console.log("---it's your turn but you (X) lose.")
            lostMatch = true
          }
          return res.status(200).send({ positions: positions, user: userXorO, lostMatch: lostMatch })
        }
      }
    })
}

//---------------------------------------------------------------------------------------------------------------------------


exports.myMove = (req, res) => {
  console.log("-------------------myMove")
  reqUserId = req.params.id
  reqMatchNumber = req.body.matchN
  myMove = req.body.myMove
  let myMoveCtr
  if (myMove.toString().length == 1 && myMove.match(/[^0-9 ]/g) == null) {
    myMoveCtr = true;
    console.log("---myMove cell's number control OK")
  }
  else {
    myMoveCtr = false;
    console.log("---myMove cell's number control NO")
  }
  console.log("---myMove req information: id: " + reqUserId + "  match: " + reqMatchNumber + "  move: " + myMove)
  let userXorO
  //getting the user's match informations and verify them. Then upload gamePositions db array.
  Match.find()
    .exec((error, matchs) => {
      let thisMatch = (matchs.filter(matchsToFilter => matchsToFilter.matchNumber == reqMatchNumber))
      if (thisMatch[0] == undefined) {
        console.log("---Corrupted req")
        return res.status(403).send({ message: "Ti servono un ID ed un numero partita" })
      }


      if (thisMatch[0].gamePositions != undefined && thisMatch[0].gamePositions.includes(myMove)) {
        console.log("---User want to play in a yet used cell")
        return res.status(403).send({ message: "Non puoi giocare qui!" })
      }

      if (thisMatch[0].userIdO == reqUserId && thisMatch[0].playingUser == "second" && thisMatch[0].matchOpen == false && myMoveCtr) {
        console.log("---User O move accepted ")
        userXorO = "O"
        let _thisMatch = { ...thisMatch };
        _thisMatch.gamePositions = _thisMatch[0].gamePositions + myMove.toString() + userXorO
        _thisMatch.playingUser = "first"
        let query = { 'matchNumber': thisMatch[0].matchNumber };
        Match.findOneAndUpdate(query, _thisMatch, { upsert: true }, function (err, doc) {
          if (err) return res.status(500).send({ error: err });
          return res.status(200).send({ message: "Il tuo turno è finito" });
        })
      }
      if (thisMatch[0].userIdX == reqUserId && thisMatch[0].playingUser == "first" && thisMatch[0].matchOpen == false && myMoveCtr) {
        console.log("---User X move accepted ")
        userXorO = "X"
        let _thisMatch = { ...thisMatch };
        if (_thisMatch.gamePositions == undefined) {
          console.log("---User move is the first match move")
          _thisMatch.gamePositions = ""
        }
        _thisMatch.gamePositions = _thisMatch[0].gamePositions + myMove.toString() + userXorO
        _thisMatch.playingUser = "second"
        let query = { 'matchNumber': thisMatch[0].matchNumber };
        Match.findOneAndUpdate(query, _thisMatch, { upsert: true }, function (err, doc) {
          if (err) return res.status(500).send({ error: err });
          return res.status(200).send({ message: "Il tuo turno è finito" });
        })
      } if (error) {
        return res.status(403).json({ message: "Non puoi giocare qui!" })
      }
    })
}

//---------------------------------------------------------------------------------------------------------------------------


exports.message = (req, res) => {
  console.log("-------------------message")
  reqUserId = req.params.id
  reqMsg = req.body.msg
  reqMatchNumber = req.body.matchN
  console.log(reqUserId)
  console.log(reqMsg)
  console.log(reqMatchNumber)
  let messageToReturn

  if (reqUserId.match(/[^a-zA-Z0-9 ]/g) != null || reqMsg.match(/[^a-zA-Z0-9 ]/g) != null) {
    console.log("---reqUserId or reqUserMatchNumber are wrong")
    return res.status(403).send({ message: "ID e n° partita necessari oppure caratteri proibiti nel msg" })
  }

  Match.find().exec((error, matchs) => {
    let thisMatch = (matchs.filter(matchsToFilter => matchsToFilter.matchNumber == reqMatchNumber))
    if (thisMatch[0] == undefined) {
      console.log("---Corrupted req")
      return res.status(403).send({ message: "ID e n° partita necessari" })
    }

    //case: first message sender is user X
    if (thisMatch[0].chat == "" && thisMatch[0].userIdX == reqUserId) {
      console.log("---User is X and msg is empty")
      let _thisMatch = { ...thisMatch };
      _thisMatch.chat = reqMsg + "X"
      let query = { 'matchNumber': thisMatch[0].matchNumber };
      Match.findOneAndUpdate(query, _thisMatch, { upsert: true }, function (err, doc) {
        if (err) return res.status(500).send({ error: err });
        return res.status(201).send({ message: "Il tuo messaggio è stato inviato" });
      })
    }

    //case: first message sender is user O
    if (thisMatch[0].chat == "" && thisMatch[0].userIdO == reqUserId) {
      console.log("---User is X and msg is empty")
      let _thisMatch = { ...thisMatch };
      _thisMatch.chat = reqMsg + "O"
      let query = { 'matchNumber': thisMatch[0].matchNumber };
      Match.findOneAndUpdate(query, _thisMatch, { upsert: true }, function (err, doc) {
        if (err) return res.status(500).send({ error: err });
        return res.status(201).send({ message: "Il tuo messaggio è stato inviato" });
      })
    }


    //case:  message sender is user X
    if (thisMatch[0].chat != "" && thisMatch[0].chat[thisMatch[0].chat.length - 1] == "X") {
      console.log("last message sender is X")
      if (thisMatch[0].userIdO == reqUserId) {
        console.log("get X message")
        messageToReturn = thisMatch[0].chat.slice(0, -1)
        let _thisMatch = { ...thisMatch };
        _thisMatch.chat = reqMsg+"O"
        let query = { 'matchNumber': thisMatch[0].matchNumber };
        Match.findOneAndUpdate(query, _thisMatch, { upsert: true }, function (err, doc) {
          if (err) return res.status(500).send({ error: err });
          return res.status(200).send({ message: messageToReturn });
        })
      }
      if (thisMatch[0].chat != "" && thisMatch[0].userIdX == reqUserId) {
        console.log("O didn't answer.. please wait !")
        return res.status(403).send({ message: "Aspetta che il giocatore legga il tuo ultimo messaggio grazie" })
      }
    }

    //case:  message sender is user O
    if (thisMatch[0].chat[thisMatch[0].chat.length - 1] == "O") {
      console.log("last message sender is O ")
      if (thisMatch[0].userIdX == reqUserId) {
        console.log("get O message")
        messageToReturn = thisMatch[0].chat.slice(0, -1)
        let _thisMatch = { ...thisMatch };
        _thisMatch.chat = reqMsg+"X"
        let query = { 'matchNumber': thisMatch[0].matchNumber };
        Match.findOneAndUpdate(query, _thisMatch, { upsert: true }, function (err, doc) {
          if (err) return res.status(500).send({ error: err });
          return res.status(200).send({ message: messageToReturn });
        })

      }

      if (thisMatch[0].userIdO == reqUserId) {
        console.log("X didn't answer.. please wait !")
        return res.status(403).send({ message: "Aspetta che il giocatore legga il tuo ultimo messaggio grazie" })
      }
    }
  }
  )
}














