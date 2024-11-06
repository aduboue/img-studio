export const pages = {
  Generate: {
    name: 'Generate',
    description: 'Generate new content from scratch',
    href: '/generate',
    status: 'true',
  },
  Edit: {
    name: 'Edit',
    description: 'Import and edit existing content',
    href: '/edit',
    status: process.env.NEXT_PUBLIC_EDIT_ENABLED,
  },
  Library: {
    name: 'Library',
    description: "Browse your team's shared content",
    href: '/library',
    status: 'true',
  },
}
