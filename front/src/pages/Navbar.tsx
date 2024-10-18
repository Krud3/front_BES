import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuIndicator,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    NavigationMenuViewport,
  } from "@/components/ui/navigation-menu"

import { ModeToggle } from "@/components/mode-toggle"
import { Link } from 'react-router-dom'

function Navbar() {
    return (
    <NavigationMenu>
    <NavigationMenuList>
        <NavigationMenuItem>
            <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
                <NavigationMenuContent>
                    <NavigationMenuLink>
                    <Link to="/cosmograph" aria-label="Cosmograph">
                        Link
                    </Link>
                    </NavigationMenuLink>
                </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
            <ModeToggle/>
        </NavigationMenuItem>
    </NavigationMenuList>
    </NavigationMenu>

    )
}

export default Navbar