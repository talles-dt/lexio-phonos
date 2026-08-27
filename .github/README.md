# Pronunciation Trainer

## Project Overview

This repository contains the **Pronunciation Trainer** - an interactive web application for improving English pronunciation through targeted drills, real-time audio analysis, and detailed feedback.

## Quick Links

- [Live Demo](#) (coming soon)
- [Documentation](https://github.com/mistralai/pronunciation-trainer#readme)
- [Issues](https://github.com/mistralai/pronunciation-trainer/issues)
- [Pull Requests](https://github.com/mistralai/pronunciation-trainer/pulls)

## Development

### Local Setup

```bash
# Clone the repository
git clone https://github.com/mistralai/pronunciation-trainer.git
cd pronunciation-trainer

# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push
npx prisma db seed

# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio |

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Code of Conduct

Please follow our [Code of Conduct](CODE_OF_CONDUCT.md) when contributing to this project.

## Security

If you discover a security vulnerability, please see our [Security Policy](SECURITY.md).
