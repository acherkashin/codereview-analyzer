import { Box, Button, Divider, Drawer, Paper, Typography, useMediaQuery } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { createSvgIcon } from '@mui/material/utils';
import { Link as RouterLink } from 'react-router-dom';
import { NavItem } from './NavItem';

export const UserIcon = createSvgIcon(
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>,
  'User'
);

export const UsersIcon = createSvgIcon(
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
  </svg>,
  'Users'
);

export const ChartBarIcon = createSvgIcon(
  <svg viewBox="0 0 20 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M0.399902 10.2C0.399902 9.88175 0.52633 9.57652 0.751374 9.35148C0.976418 9.12644 1.28164 9.00001 1.5999 9.00001H3.9999C4.31816 9.00001 4.62339 9.12644 4.84843 9.35148C5.07347 9.57652 5.1999 9.88175 5.1999 10.2V16.2C5.1999 16.5183 5.07347 16.8235 4.84843 17.0485C4.62339 17.2736 4.31816 17.4 3.9999 17.4H1.5999C1.28164 17.4 0.976418 17.2736 0.751374 17.0485C0.52633 16.8235 0.399902 16.5183 0.399902 16.2V10.2ZM7.5999 5.40001C7.5999 5.08175 7.72633 4.77652 7.95137 4.55148C8.17642 4.32643 8.48164 4.20001 8.7999 4.20001H11.1999C11.5182 4.20001 11.8234 4.32643 12.0484 4.55148C12.2735 4.77652 12.3999 5.08175 12.3999 5.40001V16.2C12.3999 16.5183 12.2735 16.8235 12.0484 17.0485C11.8234 17.2736 11.5182 17.4 11.1999 17.4H8.7999C8.48164 17.4 8.17642 17.2736 7.95137 17.0485C7.72633 16.8235 7.5999 16.5183 7.5999 16.2V5.40001ZM14.7999 1.80001C14.7999 1.48175 14.9263 1.17652 15.1514 0.951478C15.3764 0.726434 15.6816 0.600006 15.9999 0.600006H18.3999C18.7182 0.600006 19.0234 0.726434 19.2484 0.951478C19.4735 1.17652 19.5999 1.48175 19.5999 1.80001V16.2C19.5999 16.5183 19.4735 16.8235 19.2484 17.0485C19.0234 17.2736 18.7182 17.4 18.3999 17.4H15.9999C15.6816 17.4 15.3764 17.2736 15.1514 17.0485C14.9263 16.8235 14.7999 16.5183 14.7999 16.2V1.80001Z" />
  </svg>,
  'ChartBar'
);

const items = [
  {
    href: '/charts',
    icon: <ChartBarIcon fontSize="small" />,
    title: 'Charts',
  },
  {
    href: '/ready-mrs',
    icon: null,
    title: 'Ready Merge Requests',
  },
  {
    href: '/personal',
    icon: <UserIcon fontSize="small" />,
    title: 'Personal Statistic',
  },
  //   {
  //     href: '/customers',
  //     title: 'Customers',
  //   },
  //   {
  //     href: '/account',
  //     icon: <UserIcon fontSize="small" />,
  //     title: 'Account',
  //   },
];

export interface SideBarProps {}

export const SideBar = (props: SideBarProps) => {
  // const lgUp = useMediaQuery((theme) => (theme as any).breakpoints.up('lg'), {
  //   defaultMatches: true,
  //   noSsr: false,
  // });

  const lgUp = true;

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
          <Box sx={{ p: 3 }}>
            <RouterLink to="/">Logo</RouterLink>
          </Box>
          <Box sx={{ px: 2 }}>
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
          </Box>
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
            Need more features?
          </Typography>
          <Typography color="neutral.500" variant="body2">
            Check out our Pro solution template.
          </Typography>
          <Box
            sx={{
              display: 'flex',
              mt: 2,
              mx: 'auto',
              width: '160px',
              '& img': {
                width: '100%',
              },
            }}
          >
            <img alt="Go to pro" src="/static/images/sidebar_pro.png" />
          </Box>
          <RouterLink to="https://material-kit-pro-react.devias.io/">
            <Button color="secondary" component="a" endIcon={<OpenInNewIcon />} fullWidth sx={{ mt: 2 }} variant="contained">
              Pro Live Preview
            </Button>
          </RouterLink>
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
};
