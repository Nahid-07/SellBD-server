const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
const stripe = require("stripe")('sk_test_51M663EI0d7d7hgOsq1dJvhUdwUvG0N9xucJ6cLJLKMiui8WAq248xGm5tP384UdlrARL2FqrC0oW4n3HZU7NTl4100YCGHNPvy');
require('dotenv').config()

// middleware
app.use(cors())
app.use(express.json())

app.get('/',(req,res)=>{
    res.send('assignment-12 server is running')
})

const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_USER_PASS}@cluster0.ugpmzsn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run(){
    try{
        const userCollection = client.db('assignment-12-DB').collection('user')
        const categoryCollections = client.db('assignment-12-DB').collection('categoriesOfProduct');
        const productCollections = client.db('assignment-12-DB').collection('products')
        const bookingCollections = client.db('assignment-12-DB').collection('buyer')
        const paymentsCollection = client.db('assignment-12-DB').collection('payment')
        //  home page category api
        app.get('/category', async(req,res)=>{
            const query = {}
            const category = await categoryCollections.find(query).toArray()
            res.send(category)
        })
        // inside category product api
        app.post('/product',async(req,res)=>{
            const product = req.body
            const result = await productCollections.insertOne(product);
            res.send(result)
        })
        // get product via id api
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

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await userCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await userCollection.findOne(query);
            res.send({ isAdmin: user?.userType === 'Seller' });
        })

        app.put('/users/admin/:id',verifyJWT,async(req,res)=>{
            const decodedEmail = req.decoded.email;
            const query = {email : decodedEmail}
            const user = await userCollection.findOne(query)

            if(user?.role !== 'admin'){
                return res.status(403).send({message: 'access denied'})
            }

            const id = req.params.id;
            const filter = {_id : ObjectId(id)}
            const options = {upsert : true};
            const updatedDoc = {
                $set:{
                    role : 'admin'
                }
            }
            const result = await userCollection.updateOne(filter,updatedDoc,options)
            res.send(result)
        })

        app.get('/users/seller',async(req,res)=>{
            const query = { userType : 'Seller' }
            const seller = await userCollection.find(query).toArray()
            res.send(seller)
        })

        app.get('/users/buyer', async(req,res)=>{
            const query = {userType : 'Buyer'}
            const buyer = await userCollection.find(query).toArray();
            res.send(buyer)
        })

        // seller delete api
        app.delete('/allseller/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id : ObjectId(id)}
            const deletedSeller = await userCollection.deleteOne(query);
            res.send(deletedSeller)
        })

        // delete buyer api
        app.delete('/allbuyer/:id',async(req,res)=>{
            const id = req.params.id;
            console.log(id);
            const query = {_id : ObjectId(id)};
            const deletedBuyer = await userCollection.deleteOne(query);
            res.send(deletedBuyer)
        })
        app.post('/buyer', async(req,res)=>{
            const buyer = req.body;
            const result = await bookingCollections.insertOne(buyer);
            res.send(result)
        })
        app.get('/buyer', async(req,res)=>{
            const query ={};
            const buyers = await bookingCollections.find(query).toArray()
            res.send(buyers)
        })
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });
        app.get('/myorders',verifyJWT, async(req,res)=>{
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if(decodedEmail !== email){
                return res.status(403).send({message : 'forbidden access'})
            }
            const query = {email : email}
            const result = await bookingCollections.find(query).toArray()
            res.send(result)
        })
        app.get('/bookings/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id : ObjectId(id)}
            const result = await bookingCollections.findOne(query)
            res.send(result)
        })

        // payment api
        app.post('/create-payment-intent', async (req, res) => {
            const product = req.body;
            const price = product.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payments', async (req, res) =>{
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = {_id: ObjectId(id)}
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingCollections.updateOne(filter, updatedDoc)
            res.send(result);
        })

    }
    finally{

    }
}
run().catch(err=>console.log(err.message))

app.listen(port,()=>{
    console.log('Server is running');
})