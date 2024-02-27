import { Meta, StoryObj } from '@storybook/react';
import { UsersList } from './UsersList';
import { User } from '../../services/types';

export default {
  title: 'Components/UsersList',
  component: UsersList,
  parameters: {
    // More on Story layout: https://storybook.js.org/docs/react/configure/story-layout
    layout: 'centered',
  },
} as Meta<typeof UsersList>;

type Story = StoryObj<typeof UsersList>;

export const Default: Story = {
  args: {
    style: { width: 300 },
    user: undefined,
    users: () => Promise.resolve(users),
    onSelected: (user) => {
      console.log(user);
    },
  },
};

const users: User[] = [
  {
    id: '1',
    fullName: 'Alice',
    displayName: 'alice',
    webUrl: '#',
    userName: '@alice',
    avatarUrl: 'https://cdn-icons-png.flaticon.com/512/219/219969.png',
    active: true,
  },
  {
    id: '2',
    fullName: 'Bob',
    displayName: 'bob',
    webUrl: '#',
    userName: '@bob',
    avatarUrl: 'https://via.placeholder.com/150',
    active: true,
  },
  {
    id: '3',
    fullName: 'Charlie',
    displayName: 'charlie',
    webUrl: '#',
    userName: '@charlie',
    avatarUrl: 'https://via.placeholder.com/150',
    active: true,
  },
];
