import {
    User, Mail, Phone, MapPin, Shield, Bell, LogOut, ChevronRight, Camera,
    Crown, Search, Trophy, Medal, Award, Leaf, RefreshCw, Zap, AlertTriangle,
    Droplets, ThermometerSun, Video, Circle, StopCircle, Accessibility, Users,
    PawPrint, History, Building2, ArrowLeft, ChevronDown, Eye, EyeOff, Key,
    Lock, Check, X, ArrowRight, CreditCard, Save
} from 'lucide-react-native';
import { cssInterop } from 'nativewind';

function interopIcon(icon: any) {
    cssInterop(icon, {
        className: {
            target: 'style',
            nativeStyleToProp: {
                color: true,
                opacity: true,
            },
        },
    });
    return icon;
}

export const UserIcon = interopIcon(User);
export const MailIcon = interopIcon(Mail);
export const PhoneIcon = interopIcon(Phone);
export const MapPinIcon = interopIcon(MapPin);
export const ShieldIcon = interopIcon(Shield);
export const BellIcon = interopIcon(Bell);
export const LogOutIcon = interopIcon(LogOut);
export const ChevronRightIcon = interopIcon(ChevronRight);
export const CameraIcon = interopIcon(Camera);
export const CrownIcon = interopIcon(Crown);
export const SearchIcon = interopIcon(Search);
export const TrophyIcon = interopIcon(Trophy);
export const MedalIcon = interopIcon(Medal);
export const AwardIcon = interopIcon(Award);
export const LeafIcon = interopIcon(Leaf);
export const RefreshCwIcon = interopIcon(RefreshCw);
export const ZapIcon = interopIcon(Zap);
export const AlertTriangleIcon = interopIcon(AlertTriangle);
export const DropletsIcon = interopIcon(Droplets);
export const ThermometerSunIcon = interopIcon(ThermometerSun);
export const VideoIcon = interopIcon(Video);
export const CircleIcon = interopIcon(Circle);
export const StopCircleIcon = interopIcon(StopCircle);
export const AccessibilityIcon = interopIcon(Accessibility);
export const UsersIcon = interopIcon(Users);
export const PawPrintIcon = interopIcon(PawPrint);
export const HistoryIcon = interopIcon(History);
export const Building2Icon = interopIcon(Building2);
export const ArrowLeftIcon = interopIcon(ArrowLeft);
export const ChevronDownIcon = interopIcon(ChevronDown);
export const EyeIcon = interopIcon(Eye);
export const EyeOffIcon = interopIcon(EyeOff);
export const LockIcon = interopIcon(Lock);
export const CheckIcon = interopIcon(Check);
export const XIcon = interopIcon(X);
export const ArrowRightIcon = interopIcon(ArrowRight);

export const CreditCardIcon = interopIcon(CreditCard);
export const SaveIcon = interopIcon(Save);
export const KeyIcon = interopIcon(Key);

// Export aliases for backward compatibility and easier imports
export { UserIcon as User, MailIcon as Mail, PhoneIcon as Phone, MapPinIcon as MapPin, ShieldIcon as Shield, BellIcon as Bell, LogOutIcon as LogOut, ChevronRightIcon as ChevronRight, CameraIcon as Camera, CrownIcon as Crown, SearchIcon as Search, TrophyIcon as Trophy, MedalIcon as Medal, AwardIcon as Award, LeafIcon as Leaf, RefreshCwIcon as RefreshCw, ZapIcon as Zap, AlertTriangleIcon as AlertTriangle, DropletsIcon as Droplets, ThermometerSunIcon as ThermometerSun, VideoIcon as Video, CircleIcon as Circle, StopCircleIcon as StopCircle, AccessibilityIcon as Accessibility, UsersIcon as Users, PawPrintIcon as PawPrint, HistoryIcon as History, Building2Icon as Building2, ArrowLeftIcon as ArrowLeft, ChevronDownIcon as ChevronDown, EyeIcon as Eye, EyeOffIcon as EyeOff, KeyIcon as Key, LockIcon as Lock, CheckIcon as Check, XIcon as X, ArrowRightIcon as ArrowRight, CreditCardIcon as CreditCard, SaveIcon as Save };
