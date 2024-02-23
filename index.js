const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI)
const { Schema } = mongoose;

const UserSchema = new Schema({
  username: String,
});

const User = mongoose.model('User', UserSchema,);

const ExerciseSchema = new Schema({
  user_id: {type: String, required: true},
  description: String,
  duration: Number,
  date: Date,
});

const Exercise = mongoose.model('Exercise', ExerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  console.log(req.body);
  const userObj = new User({
    username: req.body.username
  })

  try {
    const user = await userObj.save()
    console.log(userObj);
    res.json(user)
  } catch(err) {
    console.log(err)
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(id)
    if (!user) {
      res.send('Unknown userId')
    } else {
      const exerciseObj = new Exercise({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date
      })
      const exercise = await exerciseObj.save()
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      })
    }
  } catch(err) {
    console.error(err);
    // res.send('Error saving the exercise')
  }
})

app.get('/api/users', async (req, res) => {
  const users = await User.find({}).select('_id username')
  if (!users) {
    res.send('No users found')
  } else {
    res.json(users)
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const id = req.params._id;
  const user = await User.findById(id)
  if (!User) {
    res.send('Could not find any user with that id')
    return;
  }
  let dateObj = {}
  if (from) {
    dateObj['$gte'] = new Date(from)
  }
  if (to) {
    dateObj['$lte'] = new Date(to)
  }
  let filter = {
    user_id: id
  }
  if (from || to) {
    filter.date = dateObj
  }

  const exercises = await Exercise.find(filter).limit(+limit ?? 500)

  const log = exercises.map(exercise => {
    return {
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    }
  
  })

  res.json({
    username: user.username,
    _id: user._id,
    log
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
