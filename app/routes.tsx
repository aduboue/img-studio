export const pages = {
  Generate: {
    name: 'Generate',
    description: 'Create new content from scratch or with references',
    href: '/generate',
    status: 'true',
  },
  Edit: {
    name: 'Edit',
    description: 'Import, edit and transform existing content',
    href: '/edit',
    status: process.env.NEXT_PUBLIC_EDIT_ENABLED,
  },
  Library: {
    name: 'Browse',
    description: "Explore shared creations from your team's Library",
    href: '/library',
    status: 'true',
  },
}
