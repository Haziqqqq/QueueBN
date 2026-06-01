import 'package:flutter/material.dart';

/// Centers content and caps its width on large screens (tablets, foldables,
/// desktop) so layouts don't stretch awkwardly wide.
class CenteredContainer extends StatelessWidget {
  const CenteredContainer({super.key, required this.child, this.maxWidth = 600});

  final Widget child;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.topCenter,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: child,
      ),
    );
  }
}
