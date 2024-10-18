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

function Navbar() {
    return (
    <NavigationMenu>
    <NavigationMenuList>
        <NavigationMenuItem>
            <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
                <NavigationMenuContent>
                    <NavigationMenuLink>Link</NavigationMenuLink>
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