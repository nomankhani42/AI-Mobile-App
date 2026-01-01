import axios from 'axios';

export const testBackendConnection = async () => {
  const urls = [
    'http://10.0.2.2:8000/health',
    'http://localhost:8000/health',
    'http://127.0.0.1:8000/health',
  ];

  console.log('🔍 Testing backend connections...');

  for (const url of urls) {
    try {
      console.log(`Testing: ${url}`);
      const response = await axios.get(url, {timeout: 5000});
      console.log(`✅ SUCCESS: ${url}`, response.data);
      return url.replace('/health', '');
    } catch (error: any) {
      console.log(`❌ FAILED: ${url}`, error.message);
    }
  }

  console.log('❌ All connection attempts failed');
  return null;
};
