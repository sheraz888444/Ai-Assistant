import axios from 'axios';

async function testEndpoint() {
  try {
    const response = await axios.get('http://localhost:5000/api/user/currentUser', {
      withCredentials: true
    });
    console.log('Server is running! Response:', response.status, response.data);
  } catch (error) {
    console.log('Error connecting to server:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testEndpoint();
