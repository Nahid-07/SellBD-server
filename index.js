const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const categoryCollections = client.db('assignment-12-DB').collection('categoriesOfProduct');
        const productCollections = client.db('assignment-12-DB').collection('products')
        const buyerCollections = client.db('assignment-12-DB').collection('buyer')
        
        app.get('/category', async(req,res)=>{
            const query = {}
            const category = await categoryCollections.find(query).toArray()
            res.send(category)
        })
        app.post('/product',async(req,res)=>{
            const product = req.body
            const result = await productCollections.insertOne(product);
            res.send(result)
        })
        app.get('/category/:id', async(req,res)=>{
            const id = req.params.id;
            // const query = {i}
            console.log(id);
            const result = await productCollections.find({id}).toArray()
            res.send(result)
        })
        app.post('/users', async(req,res)=>{
            const user = req.body;
            const result = await userCollection.insertOne(user)
            res.send(result)
        })
        app.get('/users',async(req,res)=>{
            const query = {}
            const result = await userCollection.find(query).toArray();
            res.send(result)   

        })
        app.post('/buyer', async(req,res)=>{
            const buyer = req.body;
            const result = await buyerCollections.insertOne(buyer);
            res.send(result)
        })
        app.get('/buyer', async(req,res)=>{
            const query ={};
            const buyers = await buyerCollections.find(query).toArray()
            res.send(buyers)
        })
    }
    finally{

    }
}
run().catch(err=>console.log(err.message))

app.listen(port,()=>{
    console.log('Server is running');
})