import { Meta, StoryObj } from '@storybook/react';
import { UserListItem } from './UserListItem';
import { User } from '../../services/types';

export default {
  title: 'Components/UsersListItem',
  component: UserListItem,
  parameters: {
    // More on Story layout: https://storybook.js.org/docs/react/configure/story-layout
    layout: 'centered',
  },
} as Meta<typeof UserListItem>;

type Story = StoryObj<typeof UserListItem>;

const user: User = {
  id: '1',
  fullName: 'Alice',
  displayName: 'alice',
  webUrl: '#',
  userName: '@alice',
  avatarUrl: 'https://cdn-icons-png.flaticon.com/512/219/219969.png',
  active: true,
};

export const Default: Story = {
  args: {
    style: { width: 300 },
    user: user,
  },
};
