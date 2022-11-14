import { Box, Button, Divider, /*Drawer,*/ Paper, Typography /*, useMediaQuery*/ } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link as RouterLink } from 'react-router-dom';
import { NavItem } from './NavItem';
import GppGoodRoundedIcon from '@mui/icons-material/GppGoodRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';

const items = [
  {
    href: '/charts',
    icon: <BarChartRoundedIcon />,
    title: 'Charts',
  },
  {
    href: '/personal',
    icon: <PersonRoundedIcon />,
    title: 'Personal Statistic',
  },
  {
    href: '/ready-mrs',
    icon: <GppGoodRoundedIcon />,
    title: 'Ready Merge Requests',
  },
];

export interface SideBarProps {}

export function SideBar(_: SideBarProps) {
  // const lgUp = useMediaQuery((theme) => (theme as any).breakpoints.up('lg'), {
  //   defaultMatches: true,
  //   noSsr: false,
  // });

  // const lgUp = true;

  const content = (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <div>
          <Box sx={{ paddingTop: 3 }}>
            <RouterLink to="/">
              <img src={process.env.PUBLIC_URL + '/code-review-icon.png'} alt="Code review icon" width="50px" />
            </RouterLink>
          </Box>
          {/* Later we can show the instance name and author name here */}
          {/* <Box sx={{ px: 2 }}>
            <Box
              sx={{
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                px: 3,
                py: '11px',
                borderRadius: 1,
              }}
            >
              <div>
                <Typography color="inherit" variant="subtitle1">
                  Acme Inc
                </Typography>
                <Typography color="neutral.400" variant="body2">
                  Your tier : Premium
                </Typography>
              </div>
            </Box>
          </Box> */}
        </div>
        <Divider
          sx={{
            borderColor: '#2D3748',
            my: 3,
          }}
        />
        <Box sx={{ flexGrow: 1 }}>
          {items.map((item) => (
            <NavItem key={item.title} icon={item.icon} href={item.href} title={item.title} />
          ))}
        </Box>
        <Divider sx={{ borderColor: '#2D3748' }} />
        <Box
          sx={{
            px: 2,
            py: 3,
          }}
        >
          <Typography color="neutral.100" variant="subtitle2">
            Need more features or found a bug?
          </Typography>
          <Typography color="neutral.500" variant="body2">
            Create an issue on GitHub
          </Typography>
          <Button
            href="https://github.com/acherkashin/gitlab-codereview-analyzer/issues/new"
            target="_blank"
            color="secondary"
            component="a"
            endIcon={<OpenInNewIcon />}
            fullWidth
            sx={{ mt: 2 }}
            variant="contained"
          >
            Create the issue
          </Button>
        </Box>
      </Box>
    </>
  );

  return (
    <Paper
      sx={{
        backgroundColor: 'neutral.900',
        color: '#FFFFFF',
        width: 280,
        borderRadius: 0,
        flexShrink: 0,
      }}
    >
      {content}
    </Paper>
  );

  //   if (lgUp) {
  //     return (
  //       <Drawer
  //         anchor="left"
  //         open
  //         PaperProps={{
  //           sx: {
  //             backgroundColor: 'neutral.900',
  //             color: '#FFFFFF',
  //             width: 280,
  //           },
  //         }}
  //         variant="permanent"
  //       >
  //         {content}
  //       </Drawer>
  //     );
  //   }

  //   return (
  //     <Drawer
  //       anchor="left"
  //       onClose={() => {}}
  //       open={false}
  //       PaperProps={{
  //         sx: {
  //           backgroundColor: 'neutral.900',
  //           color: '#FFFFFF',
  //           width: 280,
  //         },
  //       }}
  //       sx={{ zIndex: (theme) => theme.zIndex.appBar + 100 }}
  //       variant="temporary"
  //     >
  //       {content}
  //     </Drawer>
  //   );
}
