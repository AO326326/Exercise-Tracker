const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ObjectId  } = require('mongodb');
const client = new MongoClient(process.env.MONGO_URI);
const mongoUri = process.env.MONGO_URI;
const db = client.db('userDatabase');
let users = db.collection('users');

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.get('/generate-id', (req, res) => {
  const newId = new ObjectId();

  // Send the generated ID as a response
  res.json({ generated_id: newId.toString() });
});

app.post('/api/users', async (req, res) => {
  const newId = new ObjectId();
  const username = req.body.username;
  const doc = {
    username,
    _id: newId.toString()
  }
  const result = await users.insertOne(doc)
  console.log(result)
  res.json({username: username, _id: newId.toString()})
})

app.get('/api/users', async (req, res) => {
  const allUsers = await users.find().toArray();
  res.json(allUsers)
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id;
  const findId = await users.findOne({_id: new ObjectId(userId).toString()});
  console.log(findId, req.query.from, req.query.to)
  if (!findId) {
    return res.status(404).send('User not found');
  }
  const username = findId.username;
  console.log('Username:', username);
  const description = req.body.description;
  let duration;
  if(/^\d+$/.test(req.body.duration)){
    duration = parseInt(req.body.duration);
  }else{
    res.status(400).send('Invalid duration. Please provide a number');
    return;
  }
  let date;
if(req.body.date){
  date = new Date(req.body.date).toDateString();
} else {
date = new Date().toDateString();
}
const updateDoc = {
  description,
  duration,
  date
}
const result2 = await users.updateOne( { 
  _id: new ObjectId(userId).toString() },
    { $push: {logs: updateDoc} })
console.log(result2)

res.json({
  _id: userId,
  username: username,
  description: description,
  duration: duration,
  date: date,
})
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const userId = req.params._id;

const findTheId = await users.findOne({ _id: new ObjectId(userId).toString()});
if(!findTheId){
  return res.status(404).send('User not found');
} 
console.log(findTheId.logs)
if(req.query.from && req.query.to){
const from = new Date(req.query.from).getTime();
const to = new Date(req.query.to).getTime();
findTheId.logs = findTheId.logs.filter((log) => 
  new Date(log.date).getTime() >= from && 
  new Date(log.date).getTime() <= to
)
}
if(req.query.limit){
  findTheId.logs = findTheId.logs.splice(0,req.query.limit)
}
res.json({
  _id: userId,
  username: findTheId.username,
  log: findTheId.logs,
  count: findTheId.logs.length
});
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
