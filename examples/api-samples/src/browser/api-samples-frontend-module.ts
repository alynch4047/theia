/********************************************************************************
 * Copyright (C) 2019 Arm and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { ContainerModule } from '@theia/core/shared/inversify';
import { bindDynamicLabelProvider } from './label/sample-dynamic-label-provider-command-contribution';
import { bindSampleFilteredCommandContribution } from './contribution-filter/sample-filtered-command-contribution';
import { bindSampleUnclosableView } from './view/sample-unclosable-view-contribution';
import { bindSampleOutputChannelWithSeverity } from './output/sample-output-channel-with-severity';
import { bindSampleMenu } from './menu/sample-menu-contribution';
import { bindSampleFileWatching } from './file-watching/sample-file-watching-contribution';
import { bindVSXCommand } from './vsx/sample-vsx-command-contribution';
import { FileServiceContribution } from '@theia/filesystem/lib/browser/file-service';
import {
    LdfCommandContribution, LdfMenuContribution,
    LifionFileServiceContribution, LifionFileSystemProvider,
    LScriptLanguageGrammarContribution
} from './ldf2-contribution';
import { CommandContribution, MenuContribution } from '@theia/core/lib/common';
import { LanguageGrammarDefinitionContribution } from '@theia/monaco/lib/browser/textmate';

import '../../src/browser/style/branding.css';

export default new ContainerModule(bind => {
    bindDynamicLabelProvider(bind);
    bindSampleUnclosableView(bind);
    bindSampleOutputChannelWithSeverity(bind);
    bindSampleMenu(bind);
    bindSampleFileWatching(bind);
    bindVSXCommand(bind);
    bindSampleFilteredCommandContribution(bind);
    bind(CommandContribution).to(LdfCommandContribution);
    bind(MenuContribution).to(LdfMenuContribution);
    bind(LifionFileSystemProvider).toSelf().inSingletonScope();
    bind(FileServiceContribution).to(LifionFileServiceContribution).inSingletonScope();
    bind(LanguageGrammarDefinitionContribution).to(LScriptLanguageGrammarContribution).inSingletonScope();
});
