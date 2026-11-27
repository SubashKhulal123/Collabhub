const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const User = require('../models/User');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join user's personal room for direct messages
    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their personal room`);
    });

    // Send direct message (NEW SYSTEM)
    socket.on('send_direct_message', async (data) => {
      try {
        const { conversationId, senderId, receiverId, message } = data;

        // Get or create conversation
        let conversation = await Conversation.findById(conversationId);
        
        if (!conversation) {
          conversation = await Conversation.create({
            participants: [senderId, receiverId],
            unreadCount: new Map()
          });
        }

        // Save message to database
        const newMessage = await Message.create({
          conversation: conversation._id,
          sender: senderId,
          receiver: receiverId,
          message
        });

        // Update conversation
        conversation.lastMessage = message;
        conversation.lastMessageTime = new Date();
        conversation.updatedAt = new Date();
        
        // Increment unread count for receiver
        const currentUnread = conversation.unreadCount.get(receiverId) || 0;
        conversation.unreadCount.set(receiverId, currentUnread + 1);
        await conversation.save();

        // Populate sender info
        await newMessage.populate('sender', 'name profilePicture');

        // Emit to sender (for confirmation)
        socket.emit('message_sent', newMessage);

        // Emit to receiver
        io.to(`user_${receiverId}`).emit('new_direct_message', {
          message: newMessage,
          conversationId: conversation._id
        });

        // Create notification for receiver (with try/catch to prevent errors)
        const sender = await User.findById(senderId);
        try {
          await Notification.create({
            user: receiverId,
            type: 'new_message',
            title: 'New Message',
            message: `${sender.name} sent you a message`,
            relatedId: conversation._id,
            relatedModel: 'Conversation'
          });
        } catch (notifError) {
          console.error('Notification error:', notifError.message);
          // Don't fail the message if notification fails
        }

      } catch (error) {
        console.error('Direct message error:', error);
      }
    });

    // Join project room
    socket.on('join_project', (projectId) => {
      socket.join(`project_${projectId}`);
      console.log(`User joined project room: ${projectId}`);
    });

    socket.on('leave_project', (projectId) => {
      socket.leave(`project_${projectId}`);
    });

    // Send project message (OLD SYSTEM - Keep this working!)
    socket.on('send_message', async (data) => {
      try {
        const { projectId, senderId, receiverId, message, file } = data;

        // Save message WITHOUT conversation field
        const newMessage = await Message.create({
          project: projectId,
          sender: senderId,
          receiver: receiverId,
          message,
          file: file || null
        });

        await newMessage.populate('sender', 'name profilePicture');

        io.to(`project_${projectId}`).emit('new_message', newMessage);

        // Create notification (with try/catch)
        try {
          await Notification.create({
            user: receiverId,
            type: 'new_message',
            title: 'New Message',
            message: `New message from ${newMessage.sender.name}`,
            relatedId: projectId,
            relatedModel: 'Project'
          });
        } catch (notifError) {
          console.error('Notification error:', notifError.message);
        }

        io.to(`user_${receiverId}`).emit('new_notification', {
          type: 'new_message',
          message: `New message from ${newMessage.sender.name}`
        });
      } catch (error) {
        console.error('Project message error:', error);
      }
    });

    // Typing indicator for project chat
    socket.on('typing', (data) => {
      const { projectId, userId, isTyping } = data;
      socket.to(`project_${projectId}`).emit('user_typing', { userId, isTyping });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = socketHandler;