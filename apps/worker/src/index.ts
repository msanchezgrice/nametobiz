import 'dotenv/config';
import { runThinkingAgent } from './thinkingAgent';

async function main() {
  console.log('🚀 NametoBiz Worker starting...');
  
  try {
    await runThinkingAgent();
  } catch (error) {
    console.error('💥 Worker crashed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Worker shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Worker shutting down...');
  process.exit(0);
});

main().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
}); 