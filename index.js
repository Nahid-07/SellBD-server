const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()

// middleware
app.use(cors())
app.use(express.json())

app.get('/',(req,res)=>{
    res.send('assignment-12 server is running')
})

const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_USER_PASS}@cluster0.ugpmzsn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run(){
    try{
        const userCollection = client.db('assignment-12-DB').collection('user')
        app.post('/users', async(req,res)=>{
            const user = req.body;
            const result = await userCollection.insertOne(user)
            res.send(result)
        })
    }
    finally{

    }
}
run().catch(err=>console.log(err.message))

app.listen(port,()=>{
    console.log('Server is running');
})