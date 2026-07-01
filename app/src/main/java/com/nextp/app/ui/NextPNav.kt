package com.nextp.app.ui

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.BarChart
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.Inventory2
import androidx.compose.material.icons.rounded.ReceiptLong
import androidx.compose.ui.graphics.vector.ImageVector

/** Destinos das 4 abas principais do NextP. */
enum class NextPTab(val route: String, val label: String, val icon: ImageVector) {
    RECORDS("records", "Registos", Icons.Rounded.ReceiptLong),
    SAVED("saved", "Guardados", Icons.Rounded.Inventory2),
    PLANNING("planning", "Planeamento", Icons.Rounded.CalendarMonth),
    SUMMARY("summary", "Resumo", Icons.Rounded.BarChart),
}
