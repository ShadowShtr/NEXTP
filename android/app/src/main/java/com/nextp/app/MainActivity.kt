package com.nextp.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.nextp.app.ui.NextPTab
import com.nextp.app.ui.screens.PlanningScreen
import com.nextp.app.ui.screens.RecordsScreen
import com.nextp.app.ui.screens.SavedScreen
import com.nextp.app.ui.screens.SummaryScreen
import com.nextp.app.ui.theme.NextPColors
import com.nextp.app.ui.theme.NextPTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { NextPTheme { NextPApp() } }
    }
}

@Composable
fun NextPApp() {
    val navController = rememberNavController()
    val backStack by navController.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route ?: NextPTab.RECORDS.route

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = NextPColors.White) {
                NextPTab.entries.forEach { tab ->
                    NavigationBarItem(
                        selected = currentRoute == tab.route,
                        onClick = {
                            navController.navigate(tab.route) {
                                popUpTo(NextPTab.RECORDS.route) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = { Icon(tab.icon, contentDescription = tab.label) },
                        label = { Text(tab.label) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = NextPColors.PrimaryBlue,
                            selectedTextColor = NextPColors.PrimaryBlue,
                            indicatorColor = NextPColors.CardBlueSoft,
                        ),
                    )
                }
            }
        }
    ) { inner ->
        NavHost(
            navController = navController,
            startDestination = NextPTab.RECORDS.route,
            modifier = Modifier.padding(inner),
        ) {
            composable(NextPTab.RECORDS.route) { RecordsScreen() }
            composable(NextPTab.SAVED.route) { SavedScreen() }
            composable(NextPTab.PLANNING.route) { PlanningScreen() }
            composable(NextPTab.SUMMARY.route) { SummaryScreen() }
        }
    }
}
