import 'dart:async';

import 'package:flutter/material.dart';

/// Calls [onTick] on a fixed interval while mounted, so screens can refresh
/// their data in the background. Pairs with [AsyncView]'s skip-loading flags to
/// avoid spinner flicker during background updates.
class IntervalRefresher extends StatefulWidget {
  const IntervalRefresher({
    super.key,
    required this.interval,
    required this.onTick,
    required this.child,
  });

  final Duration interval;
  final VoidCallback onTick;
  final Widget child;

  @override
  State<IntervalRefresher> createState() => _IntervalRefresherState();
}

class _IntervalRefresherState extends State<IntervalRefresher> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(widget.interval, (_) => widget.onTick());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
