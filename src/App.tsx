import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { Gitlab } from '@gitbeaker/browser';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getFilteredComments, getUserComments, getDiscussons, UserComment, UserDiscussion } from './utils/GitLabUtils';
import { UserSchema } from '@gitbeaker/core/dist/types/types';
import { UserList } from './components/UserList';
import { CommentList } from './components/CommentList';
import { ProjectList } from './components/ProjectList';
import { Bar, BarSvgProps, BarDatum } from '@nivo/bar';
import {
  convertToCommentsLeft,
  convertToCommentsLeftToUsers,
  convertToCommentsReceived,
  convertToCommentsRecivedFromUsers,
  convertToDiscussionsLeft,
  convertToDiscussionsReceived,
} from './utils/ChartUtils';
import { Login } from './components/Login';
import {
  AppBar,
  Box,
  Container,
  IconButton,
  Toolbar,
  Typography,
  MenuItem,
  Tooltip,
  Avatar,
  Menu,
  Button,
  TextField,
  Stack,
} from '@mui/material';
import { downloadComments } from './utils/ExcelUtils';
import { ProjectSchema } from '@gitbeaker/core/dist/types/types';
import { ChartContainer } from './components/ChartContainer';

export interface Credentials {
  token: string;
  host: string;
}

const barChartSettings = {
  width: 500,
  height: 400,
  margin: { left: 150 },
  padding: 0.2,
  labelTextColor: 'inherit:darker(1.4)',
  labelSkipWidth: 16,
  labelSkipHeight: 16,
  layout: 'horizontal',
} as BarSvgProps<BarDatum>;

function App() {
  const [credentials, setCredentials] = useLocalStorage<Credentials | null>('credentials', null);
  const [selectedUser, selectUser] = useLocalStorage<UserSchema | null>('user', null);
  const [project, setProject] = useLocalStorage<ProjectSchema | null>('project', null);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [discussions, setDiscussions] = useState<UserDiscussion[]>([]);
  const [createdBefore, setCreatedBefore] = useState<Date>(new Date());
  const [createdAfter, setCreatedAfter] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [user, setUser] = useState<UserSchema | null>(null);

  const [filteredComments, setFilteredComments] = useState<UserComment[]>([]);

  const client = useMemo(() => new Gitlab(credentials), [credentials]);

  useEffect(() => {
    client.Users.current().then((current) => {
      setUser(current);
    });
  }, [client]);

  const handleAnalyze = () => {
    Promise.all([showComments(), showDiscussions()]);
  };

  const showComments = async () => {
    try {
      if (!project) return;

      const comments = await getUserComments(client, {
        projectId: project.id,
        createdAfter: createdAfter.toISOString(),
        createdBefore: createdBefore.toISOString(),
      });

      setComments(comments);
    } catch (ex) {
      console.error(ex);
    }
  };

  const showDiscussions = async () => {
    try {
      if (!project) return;

      const discussions = await getDiscussons(client, {
        projectId: project.id,
        createdAfter: createdAfter.toISOString(),
        createdBefore: createdBefore.toISOString(),
      });

      setDiscussions(discussions);

      console.log(discussions);
    } catch (ex) {
      console.error(ex);
    }
  };

  const discussionsLeft = useMemo(() => convertToDiscussionsLeft(discussions), [discussions]);
  const discussionsReceived = useMemo(() => convertToDiscussionsReceived(discussions), [discussions]);
  const commentsLeft = useMemo(() => convertToCommentsLeft(comments), [comments]);
  const commentsRecieved = useMemo(() => convertToCommentsReceived(comments), [comments]);
  const commentsRecievedFromUsers = useMemo(
    () => (selectedUser ? convertToCommentsRecivedFromUsers(comments, selectedUser.id) : null),
    [comments, selectedUser]
  );
  const commentsLeftToUsers = useMemo(
    () => (selectedUser ? convertToCommentsLeftToUsers(comments, selectedUser.id) : null),
    [comments, selectedUser]
  );
  const updateComments = useCallback(
    (reviewerName: string | null, authorName: string | null) => {
      setFilteredComments(getFilteredComments(comments, reviewerName, authorName));
    },
    [comments]
  );
  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const handleOpenUserMenu = (event: any) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setCredentials(null);
    handleCloseUserMenu();
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  if (!credentials) {
    return (
      <Login
        onLoggedIn={(token, host, user) => {
          setCredentials({
            token,
            host,
          });
          setUser(user);
        }}
      />
    );
  }

  return (
    <div className="App">
      <AppBar position="static">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Typography variant="h6" noWrap component="div" sx={{ mr: 2, display: 'flex', flexGrow: 1 }}>
              Analyzer
            </Typography>
            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt={user?.name} src={user?.avatar_url} />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                <MenuItem onClick={handleCloseNavMenu}>
                  <Typography textAlign="center">Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Box style={{ display: 'flex' }}>
        <Stack className="App-users" spacing={2}>
          <ProjectList project={project} onProjectSelected={setProject} />
          <UserList label="Author" user={selectedUser} onUserSelected={selectUser} />
          <TextField
            label="Created After"
            type="date"
            value={createdAfter?.toISOString().substring(0, 10)}
            onChange={(newValue) => {
              const newDate = new Date(newValue.target.value);
              setCreatedAfter(newDate);
            }}
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
          />
          <TextField
            label="Created Before"
            type="date"
            value={createdBefore?.toISOString().substring(0, 10)}
            onChange={(newValue) => {
              const newDate = new Date(newValue.target.value);
              setCreatedBefore(newDate);
            }}
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
          />
          <Button onClick={handleAnalyze}>Analyze</Button>
          <Button
            onClick={() => {
              downloadComments(filteredComments);
            }}
          >
            Download
          </Button>
        </Stack>
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <div className="charts">
            {selectedUser && commentsLeftToUsers && (
              <ChartContainer title={`${selectedUser?.name} reviews following people`}>
                <Bar
                  {...barChartSettings}
                  {...commentsLeftToUsers}
                  onClick={(e) => {
                    updateComments(selectedUser.username, e.data.author as string);
                  }}
                />
              </ChartContainer>
            )}
            {selectedUser && commentsRecievedFromUsers && (
              <ChartContainer title={`Following people review ${selectedUser?.name}`}>
                <Bar
                  {...barChartSettings}
                  {...commentsRecievedFromUsers}
                  onClick={(e) => {
                    updateComments(e.data.reviewer as string, selectedUser.username);
                  }}
                />
              </ChartContainer>
            )}
            <ChartContainer title="Comments left by person">
              <Bar
                {...barChartSettings}
                {...commentsLeft}
                onClick={(e) => {
                  updateComments(e.indexValue as string, e.id as string);
                }}
              />
            </ChartContainer>

            <ChartContainer title="Comments recieved by person">
              <Bar
                {...barChartSettings}
                {...commentsRecieved}
                onClick={(e) => {
                  updateComments(e.id as string, e.indexValue as string);
                }}
              />
            </ChartContainer>
            <ChartContainer title="Discussions left by person">
              <Bar
                {...barChartSettings}
                {...discussionsLeft}
                onClick={(e) => {
                  console.log(e);
                }}
              />
            </ChartContainer>
            <ChartContainer title="Discussions received by person">
              <Bar
                {...barChartSettings}
                {...discussionsReceived}
                onClick={(e) => {
                  console.log(e);
                }}
              />
            </ChartContainer>
          </div>
          <CommentList comments={filteredComments} />
          Total: {filteredComments.length}
        </div>
      </Box>
    </div>
  );
}

export default App;
