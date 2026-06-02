import 'package:go_router/go_router.dart';

import 'features/home/home_screen.dart';
import 'features/queue/queue_detail_screen.dart';
import 'features/ticket/ticket_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
    GoRoute(
      path: '/queue/:id',
      builder: (context, state) =>
          QueueDetailScreen(departmentId: state.pathParameters['id']!),
    ),
    GoRoute(
      path: '/ticket/:id',
      builder: (context, state) =>
          TicketScreen(ticketId: state.pathParameters['id']!),
    ),
  ],
);
