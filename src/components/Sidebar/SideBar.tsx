import { Box, Button, Divider, /*Drawer,*/ Paper, Typography /*, useMediaQuery*/ } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Link as RouterLink } from 'react-router-dom';
import { NavItem } from './NavItem';
import GppGoodRoundedIcon from '@mui/icons-material/GppGoodRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import { Logo } from '../Logo';
import { UserContext } from '../../utils/UserContextUtils';
import { useAuthStore } from '../../stores/AuthStore';

export interface SideBarProps {}

export function SideBar(_: SideBarProps) {
  // const lgUp = useMediaQuery((theme) => (theme as any).breakpoints.up('lg'), {
  //   defaultMatches: true,
  //   noSsr: false,
  // });

  // const lgUp = true;

  const access = useAuthStore((store) => store.userContext?.access);

  const items = getPageItems(access);

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
          <Box
            sx={{
              textAlign: 'center',
              paddingTop: 3,
            }}
          >
            <RouterLink to="/">
              <Logo />
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
                <Typography variant="subtitle1" sx={{ color: 'inherit' }}>
                  Acme Inc
                </Typography>
                <Typography variant="body2" sx={{ color: 'neutral.400' }}>
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
            textAlign: 'center',
            px: 2,
            py: 3,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: 'neutral.100',
            }}
          >
            Need more features or found a bug?
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'neutral.500',
            }}
          >
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
  //         slotProps={{
  //           paper: {
  //             sx: {
  //               backgroundColor: 'neutral.900',
  //               color: '#FFFFFF',
  //               width: 280,
  //             },
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
  //       slotProps={{
  //         paper: {
  //           sx: {
  //             backgroundColor: 'neutral.900',
  //             color: '#FFFFFF',
  //             width: 280,
  //           },
  //         },
  //       }}
  //       sx={{ zIndex: (theme) => theme.zIndex.appBar + 100 }}
  //       variant="temporary"
  //     >
  //       {content}
  //     </Drawer>
  //   );
}

interface PageItem {
  href: string;
  icon: React.ReactNode;
  title: string;
}

function getPageItems(access: UserContext['access'] | undefined) {
  if (!access) {
    return [];
  }

  const pages: PageItem[] = [
    {
      href: '/charts',
      icon: <BarChartRoundedIcon />,
      title: 'Charts',
    },
  ];

  if (access === 'full') {
    pages.push(
      {
        href: '/ready-mrs',
        icon: <GppGoodRoundedIcon />,
        title: 'Ready Merge Requests',
      },
      {
        href: '/export',
        icon: <ImportExportIcon />,
        title: 'Export',
      }
    );
  }

  return pages;
}
