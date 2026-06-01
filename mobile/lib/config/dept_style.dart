import 'package:flutter/material.dart';

/// Per-queue visual style (icon + colors).
///
/// This is a general-purpose queue app, so styles are NOT tied to any specific
/// domain (hospital, bank, government office, etc.). Colors are assigned
/// deterministically from the queue's code/name so each queue looks distinct
/// and stable across refreshes, using a neutral ticket icon throughout.
class DeptStyle {
  const DeptStyle({
    required this.icon,
    required this.bg,
    required this.color,
    required this.border,
  });

  final IconData icon;
  final Color bg;
  final Color color;
  final Color border;

  static const _palette = <({Color bg, Color color, Color border})>[
    (bg: Color(0xFFEFF6FF), color: Color(0xFF1D4ED8), border: Color(0xFFBFDBFE)),
    (bg: Color(0xFFF5F3FF), color: Color(0xFF6D28D9), border: Color(0xFFDDD6FE)),
    (bg: Color(0xFFECFDF5), color: Color(0xFF047857), border: Color(0xFFA7F3D0)),
    (bg: Color(0xFFFFF7ED), color: Color(0xFF9A3412), border: Color(0xFFFED7AA)),
    (bg: Color(0xFFFDF4FF), color: Color(0xFF86198F), border: Color(0xFFF0ABFC)),
    (bg: Color(0xFFFEF2F2), color: Color(0xFF991B1B), border: Color(0xFFFECACA)),
    (bg: Color(0xFFF0FDFA), color: Color(0xFF0F766E), border: Color(0xFF99F6E4)),
  ];

  /// Stable index from a string so a given queue always gets the same color.
  static int _indexFor(String key) {
    if (key.isEmpty) return 0;
    var hash = 0;
    for (final unit in key.codeUnits) {
      hash = (hash * 31 + unit) & 0x7fffffff;
    }
    return hash % _palette.length;
  }

  static DeptStyle of(String key) {
    final p = _palette[_indexFor(key)];
    return DeptStyle(
      icon: Icons.confirmation_number_outlined,
      bg: p.bg,
      color: p.color,
      border: p.border,
    );
  }
}
