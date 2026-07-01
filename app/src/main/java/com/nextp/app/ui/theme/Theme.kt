package com.nextp.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightScheme = lightColorScheme(
    primary = NextPColors.PrimaryBlue,
    onPrimary = NextPColors.White,
    secondary = NextPColors.LightBlue,
    background = NextPColors.Background,
    onBackground = NextPColors.TextDark,
    surface = NextPColors.CardWhite,
    onSurface = NextPColors.TextDark,
    surfaceVariant = NextPColors.CardBlueSoft,
    error = NextPColors.Danger,
    tertiary = NextPColors.SoftPurple,
)

private val DarkScheme = darkColorScheme(
    primary = NextPColors.PrimaryBlue,
    onPrimary = NextPColors.White,
    secondary = NextPColors.LightBlue,
    background = NextPColors.DarkBackground,
    onBackground = NextPColors.DarkTextDark,
    surface = NextPColors.DarkSurface,
    onSurface = NextPColors.DarkTextDark,
    error = NextPColors.Danger,
    tertiary = NextPColors.SoftPurple,
)

@Composable
fun NextPTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkScheme else LightScheme,
        typography = NextPTypography,
        shapes = NextPShapes,
        content = content,
    )
}
