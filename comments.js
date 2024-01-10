// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const axios = require('axios');
// Create express app
const app = express();
// Use body parser middleware
app.use(bodyParser.json());
// Create comments object
const commentsByPostId = {};
// Create route for getting comments
app.get('/posts/:id/comments', (req, res) => {
    // Send back comments array for post id
    res.send(commentsByPostId[req.params.id] || []);
});
// Create route for creating comments
app.post('/posts/:id/comments', async (req, res) => {
    // Create id for comment
    const commentId = randomBytes(4).toString('hex');
    // Get content and status from request body
    const { content } = req.body;
    // Get comments array for post id
    const comments = commentsByPostId[req.params.id] || [];
    // Add new comment to comments array
    comments.push({ id: commentId, content, status: 'pending' });
    // Set comments array for post id
    commentsByPostId[req.params.id] = comments;
    // Create event
    await axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId: req.params.id,
            status: 'pending',
        },
    });
    // Send back comments array for post id
    res.status(201).send(comments);
});
// Create route for receiving events
app.post('/events', async (req, res) => {
    // Get type and data from request body
    const { type, data } = req.body;
    // Check if type is CommentModerated
    if (type === 'CommentModerated') {
        // Get id, postId, status, content from data
        const { id, postId, status, content } = data;
        // Get comments array for post id
        const comments = commentsByPostId[postId];
        // Get comment from comments array
        const comment = comments.find((comment) => {
            return comment.id === id;
        });
        // Set status for comment
        comment.status = status;
        // Create event
        await axios.post('http://localhost:4005/events', {
            type: 'CommentUpdated',
            data: {
                id,
                postId,
                status,
                content,
            },
        });
    }
    res.send({});
});
// Listen on port 4001
app.listen(4001, () => {
    console.log('Listening on port 4001');
});