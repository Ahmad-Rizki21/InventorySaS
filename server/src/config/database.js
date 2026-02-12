import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'warn' },
  ],
});

prisma.$on('query', (e) => {
  const query = e.query;
  const params = e.params;
  const duration = e.duration;

  // Simple color formatting for terminal
  const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
  };

  let category = 'QUERY';
  let color = colors.cyan;

  if (query.includes('SELECT')) { category = 'SELECT'; color = colors.blue; }
  else if (query.includes('INSERT')) { category = 'INSERT'; color = colors.green; }
  else if (query.includes('UPDATE')) { category = 'UPDATE'; color = colors.yellow; }
  else if (query.includes('DELETE')) { category = 'DELETE'; color = colors.red; }

  console.log(
    `${colors.bright}${color}[${category}]${colors.reset} ` +
    `${colors.magenta}${duration}ms${colors.reset} ` +
    `${query}`
  );
  if (params !== '[]') {
    console.log(`  ${colors.cyan}Params:${colors.reset} ${params}`);
  }
});

export default prisma;
export { prisma };
