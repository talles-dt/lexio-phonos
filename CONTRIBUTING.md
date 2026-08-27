# Contributing to Pronunciation Trainer

Thank you for your interest in contributing to Pronunciation Trainer! We welcome contributions from everyone.

## How to Contribute

### Reporting Issues

If you find a bug or have a feature request, please [open an issue](https://github.com/mistralai/pronunciation-trainer/issues) on GitHub. When reporting an issue, please include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots or screen recordings (if applicable)
- Your operating system and browser version
- Any relevant error messages or console output

### Suggesting Features

We welcome feature suggestions! Please [open an issue](https://github.com/mistralai/pronunciation-trainer/issues) with:

- A clear description of the feature
- The problem it solves
- Any relevant use cases
- Mockups or design ideas (if applicable)

### Pull Requests

We welcome pull requests! Here's how to contribute code:

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
4. **Make your changes**
5. **Test your changes** thoroughly
6. **Commit your changes** with clear, descriptive commit messages
7. **Push to your fork** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request** on GitHub

### Code Style

Please follow the existing code style in the project:

- **TypeScript**: Use TypeScript for all new code
- **Formatting**: Use Prettier for code formatting
- **Linting**: Follow ESLint rules
- **Naming**: Use descriptive, meaningful names
- **Comments**: Add comments for complex logic or non-obvious code

### Testing

Please ensure your changes don't break existing functionality:

- Run `npm run lint` to check for linting errors
- Run `npm run build` to ensure the project builds successfully
- Test your changes manually in the browser
- Add tests for new functionality (if applicable)

### Commit Messages

Use clear, descriptive commit messages following this format:

```
type(scope): description

body (optional)

footer (optional)
```

Where `type` is one of:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests
- `chore`: Changes to the build process or auxiliary tools
- `revert`: Revert a previous commit

Example:
```
feat(audio): add real-time formant extraction

- Implement LPC Burg method for formant tracking
- Add pre-emphasis filter for better results
- Export F1, F2, F3 with confidence scores
```

## Development Guidelines

### Audio Processing

When working with audio:

- Use the Web Audio API for real-time processing
- Implement AudioWorklet processors for CPU-intensive tasks
- Use 16kHz sample rate for speech processing
- Normalize audio to [-1, 1] range
- Apply pre-emphasis before formant extraction

### Database

When working with the database:

- Use Prisma ORM for all database operations
- Follow the existing schema structure
- Add appropriate indexes for performance
- Use transactions for related operations
- Handle errors gracefully

### UI/UX

When working on the UI:

- Follow the existing design system
- Use Tailwind CSS for styling
- Make components reusable and composable
- Ensure mobile-first design
- Add appropriate accessibility attributes
- Test on different screen sizes

### Performance

When working on performance-critical code:

- Avoid blocking the main thread
- Use Web Workers or AudioWorklet for heavy computations
- Implement efficient algorithms
- Use memoization where appropriate
- Profile performance before optimizing

## Review Process

All pull requests will be reviewed by project maintainers. The review process may include:

- Code review and feedback
- Requests for changes or additional tests
- Discussion of design decisions
- Testing of the changes

Please be responsive to feedback and willing to make changes to your pull request.

## Recognition

All contributors will be recognized in the project's contributors list. Significant contributions may be highlighted in release notes or other project documentation.

## Code of Conduct

Please note that this project is released with a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms.

## License

By contributing to this project, you agree that your contributions will be licensed under the [MIT License](LICENSE).
